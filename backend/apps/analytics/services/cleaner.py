import pandas as pd
import numpy as np
from datetime import datetime
from ..models import ShiftRecord, DataQualityIssue

class CSVProcessor:
    @staticmethod
    def clean_and_validate(file_io):
        """
        Parses, cleans, and validates the uploaded CSV.
        Saves issues in the database and returns the cleaned dataframe.
        """
        # Load the CSV
        try:
            df = pd.read_csv(file_io)
        except Exception as e:
            raise ValueError(f"Failed to read CSV file: {str(e)}")

        # Normalize column names (strip spaces, lowercase)
        normalized_cols = {col: col.strip().lower() for col in df.columns}
        df = df.rename(columns=normalized_cols)

        # Expected normalized columns mapping
        col_mapping = {
            'date': ['date', 'day_date', 'day date', 'shift_date', 'shift date'],
            'start_time': ['shift start date/time', 'start date/time', 'start_time', 'start time', 'shift start', 'start'],
            'end_time': ['shift end date/time', 'end date/time', 'end_time', 'end time', 'shift end', 'end'],
            'duration': ['duration', 'duration (hours)', 'duration_hours', 'hours'],
            'activity_reason': ['activity reason', 'activity_reason', 'reason', 'activity']
        }

        mapped_df = pd.DataFrame()
        
        # Map columns to standard names
        for standard_name, variants in col_mapping.items():
            found_col = None
            for col in df.columns:
                if col in variants:
                    found_col = col
                    break
            if found_col:
                mapped_df[standard_name] = df[found_col]
            else:
                mapped_df[standard_name] = np.nan

        # Clear existing records and issues since we are replacing the dataset
        ShiftRecord.objects.all().delete()
        DataQualityIssue.objects.all().delete()

        issues_list = []
        records_to_create = []

        # Iterate over rows
        for idx, row in mapped_df.iterrows():
            row_num = idx + 1  # 1-based index for user reporting
            
            # Extract raw values
            raw_date = row.get('date')
            raw_start = row.get('start_time')
            raw_end = row.get('end_time')
            raw_duration = row.get('duration')
            raw_activity = row.get('activity_reason')

            # 1. Check for critical missing values
            if pd.isna(raw_date) or pd.isna(raw_activity):
                issues_list.append(DataQualityIssue(
                    row_index=row_num,
                    issue_type="MISSING_VALUE",
                    details=f"Missing critical fields: Date is '{raw_date}', Activity Reason is '{raw_activity}'.",
                    suggested_fix="Removed row from analysis.",
                    status="Excluded"
                ))
                continue

            # Parse activity reason
            activity_reason = str(raw_activity).strip()
            if not activity_reason or activity_reason.lower() == 'nan':
                issues_list.append(DataQualityIssue(
                    row_index=row_num,
                    issue_type="MISSING_VALUE",
                    details="Activity Reason is empty or invalid.",
                    suggested_fix="Removed row from analysis.",
                    status="Excluded"
                ))
                continue

            # Parse date
            parsed_date = None
            try:
                parsed_date = pd.to_datetime(raw_date).date()
            except Exception:
                issues_list.append(DataQualityIssue(
                    row_index=row_num,
                    issue_type="INVALID_TIMESTAMP",
                    details=f"Could not parse Date: '{raw_date}'.",
                    suggested_fix="Removed row from analysis.",
                    status="Excluded"
                ))
                continue

            # Parse start and end times
            parsed_start = None
            parsed_end = None
            
            if not pd.isna(raw_start):
                try:
                    parsed_start = pd.to_datetime(raw_start)
                    # Convert to timezone aware or keep naive. Django expects aware or naive.
                    # We will use naive datetimes (in UTC) for database and parse them.
                    if parsed_start.tzinfo is not None:
                        parsed_start = parsed_start.tz_convert(None)
                except Exception:
                    pass

            if not pd.isna(raw_end):
                try:
                    parsed_end = pd.to_datetime(raw_end)
                    if parsed_end.tzinfo is not None:
                        parsed_end = parsed_end.tz_convert(None)
                except Exception:
                    pass

            # Handle duration parsing
            parsed_duration = None
            if not pd.isna(raw_duration):
                try:
                    parsed_duration = float(raw_duration)
                except ValueError:
                    pass

            # Validate timing and duration
            is_valid = True
            
            # Case A: Start and end times are present
            if parsed_start and parsed_end:
                # Check if end < start
                if parsed_end < parsed_start:
                    issues_list.append(DataQualityIssue(
                        row_index=row_num,
                        issue_type="INVALID_TIMESTAMP",
                        details=f"End time ({raw_end}) is before Start time ({raw_start}).",
                        suggested_fix="Excluded row from active analytics.",
                        status="Excluded"
                    ))
                    is_valid = False
                else:
                    # Calculate duration in hours
                    calculated_duration = (parsed_end - parsed_start).total_seconds() / 3600.0
                    
                    if parsed_duration is None or parsed_duration <= 0:
                        issues_list.append(DataQualityIssue(
                            row_index=row_num,
                            issue_type="INVALID_DURATION",
                            details=f"Duration was missing or negative ({raw_duration}).",
                            suggested_fix=f"Recalculated duration from timestamps: {calculated_duration:.2f} hours.",
                            status="Resolved"
                        ))
                        parsed_duration = calculated_duration
                    elif abs(parsed_duration - calculated_duration) > 0.01:
                        issues_list.append(DataQualityIssue(
                            row_index=row_num,
                            issue_type="INVALID_DURATION",
                            details=f"Duration mismatch: listed {parsed_duration}h, calculated {calculated_duration:.2f}h.",
                            suggested_fix=f"Updated duration to match timestamps: {calculated_duration:.2f} hours.",
                            status="Resolved"
                        ))
                        parsed_duration = calculated_duration
            else:
                # Missing start or end times
                if parsed_duration is None or parsed_duration <= 0:
                    issues_list.append(DataQualityIssue(
                        row_index=row_num,
                        issue_type="MISSING_VALUE",
                        details="Missing both start/end times and valid duration.",
                        suggested_fix="Removed row from analysis.",
                        status="Excluded"
                    ))
                    continue
                else:
                    issues_list.append(DataQualityIssue(
                        row_index=row_num,
                        issue_type="MISSING_VALUE",
                        details="Start time or End time is missing, using listed duration.",
                        suggested_fix="Kept duration; start/end times remain empty.",
                        status="Flagged"
                    ))

            # Store record for creation
            records_to_create.append(ShiftRecord(
                id=row_num,  # We can set the ID to match row number for easy lookup
                date=parsed_date,
                start_time=parsed_start,
                end_time=parsed_end,
                duration=parsed_duration,
                activity_reason=activity_reason,
                is_valid=is_valid
            ))

        # Check for duplicates (same start, end, date, and activity)
        # We will bulk create records first, then check overlap & duplicate on the clean set
        ShiftRecord.objects.bulk_create(records_to_create)
        
        # Detect duplicates
        unique_checks = {}
        for r in records_to_create:
            if not r.is_valid:
                continue
            key = (r.date, r.start_time, r.end_time, r.activity_reason)
            if key in unique_checks:
                # Mark as duplicate
                r.is_valid = False
                r.save(update_fields=['is_valid'])
                
                issues_list.append(DataQualityIssue(
                    row_index=r.id,
                    issue_type="DUPLICATE",
                    details=f"Duplicate record found for {r.date} {r.start_time} - {r.end_time} ({r.activity_reason}).",
                    suggested_fix="Excluded duplicate from analytics.",
                    status="Excluded"
                ))
            else:
                unique_checks[key] = r

        # Detect overlapping shifts for valid records
        valid_records = [r for r in records_to_create if r.is_valid and r.start_time and r.end_time]
        valid_records.sort(key=lambda x: x.start_time)

        for i in range(len(valid_records)):
            r1 = valid_records[i]
            for j in range(i + 1, len(valid_records)):
                r2 = valid_records[j]
                # If start of second is before end of first, there is overlap
                if r2.start_time < r1.end_time:
                    issues_list.append(DataQualityIssue(
                        row_index=r2.id,
                        issue_type="TIMESTAMP_OVERLAP",
                        details=f"Overlap detected with row {r1.id}: {r2.start_time} starts before row {r1.id} ends at {r1.end_time}.",
                        suggested_fix="Excluded overlapping row from analytics.",
                        status="Excluded"
                    ))
                    r2.is_valid = False
                    r2.save(update_fields=['is_valid'])
                else:
                    # Since they are sorted, no need to check further if r2 start is after r1 end
                    break

        # Save all data quality issues
        DataQualityIssue.objects.bulk_create(issues_list)

        return ShiftRecord.objects.filter(is_valid=True).count(), DataQualityIssue.objects.count()
