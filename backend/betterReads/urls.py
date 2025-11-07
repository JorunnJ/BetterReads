from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('create-user/', views.create_user, name='create_user'),
    path('search/', views.search_books, name='search_books'),
    path('get_book/', views.get_book, name='get_book'),
    path('get-csrf/', views.get_csrf, name='get_csrf'),  
    path('sign_in/', views.sign_in, name='sign_in'),  
    path('search_users/', views.search_users, name='search_users'),  
    path('get_user_by_token/', views.get_user_by_token, name='get_user_by_token'),  
    path('get_user_by_name/', views.get_user_by_name, name='get_user_by_name'),  
    path('add_friend/', views.add_friend, name='add_friend'),  
    path('get_friends/', views.get_friends, name='get_friends'),  
    path('add_book_to_shelf/', views.add_book_to_shelf, name='add_book_to_shelf'),  
    path('get_shelf_for_user/', views.get_shelf_for_user, name='get_shelf_for_user'),  
    path('check_book/', views.check_book, name='check_book'),
    path('feed/', views.get_feed, name='get_feed'),
    path('check_book/', views.check_book, name='check_book'),  
    path('get_reviews_for_book/', views.get_reviews_for_book, name='get_reviews_for_book'),  
    path('add_book_to_db/', views.add_book_to_db, name='add_book_to_db'),  
    path('submit_review/', views.submit_review, name='submit_review'), 
    path('add_shelf/', views.add_shelf, name='add_shelf'), 
    path('get_shelf_from_username/', views.get_shelf_from_username, name='get_shelf_from_username'), 
    path('get_user_reviews/', views.get_user_reviews),

    # URL for obtaining JWT tokens
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('user_profile/', views.user_profile, name='user_profile'),
]

