from rest_framework import serializers
from .models import Reviews

class ReviewSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title')  # för att enkelt få med boktiteln

    class Meta:
        model = Reviews
        fields = ['title', 'book_title', 'content']

