from django.db import models
from django.contrib.auth.models import AbstractUser

class BookUser(AbstractUser): 
    profile_url = models.CharField(max_length = 70, default='https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png')
    description = models.CharField(max_length = 70, default="Hi!")
    friends = models.ManyToManyField("self", blank=True, symmetrical=False)

class Book(models.Model):
    title = models.CharField(max_length = 40)
    author = models.CharField(max_length = 40)
    year = models.IntegerField()
    url = models.CharField(max_length = 600)
    key = models.CharField(max_length = 400, unique = True)
    rating = models.IntegerField(default=0)

    def __str__(self):
        return self.title

class BookShelf(models.Model):
    title = models.CharField(max_length = 400, default='MyShelf')
    user = models.ForeignKey(BookUser, on_delete=models.CASCADE, related_name='bookshelves') #A shelf has a user, users can have many shelves. 
    books = models.ManyToManyField(Book, related_name='bookshelves') # A shelf can have many books, a book can be in many shelves. 

    class Meta: 
        constraints = [
            models.UniqueConstraint(fields = ['title', 'user'], name='unique_shelf_user')
        ]

class Activity(models.Model):
    ACTION_CHOICES = [
        ('marked_read', 'Marked as Read'),
        ('marked_current', 'Marked as Currently Reading'),
        ('added_to_shelf', 'Added to Shelf'),
    ]

    user = models.ForeignKey(BookUser, on_delete=models.CASCADE, related_name='activities')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    shelf_title = models.CharField(max_length=400, blank=True, null=True) 
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

        
class Reviews(models.Model):
    title = models.CharField(max_length = 400, default='MyShelf')
    user = models.ForeignKey(BookUser, on_delete=models.CASCADE, related_name='reviews') #A review has a user, users can have many reviews. 
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews') #A review has a book, books can have many reviews. 
    content = models.TextField()
    rating = models.IntegerField(default=0)  # Rating from 1 to 5
    
    def __str__(self):
        return f"{self.user.username} reviewed {self.book.title}"
