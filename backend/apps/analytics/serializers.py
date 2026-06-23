from rest_framework import serializers
from .models import ShiftRecord, DataQualityIssue

class ShiftRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftRecord
        fields = '__all__'


class DataQualityIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataQualityIssue
        fields = '__all__'
