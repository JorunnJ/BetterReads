import json
import requests

from betterReads.models import Book, BookUser,BookShelf, Activity,  Reviews

from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import AnonymousUser
from .serializers import ReviewSerializer


""" Open Library API"""

"""
Fetches the description of a book from Open Library API using the work key.
Returns the description if available, otherwise returns None.
"""
def get_description(work_key):
    work_url = f'https://openlibrary.org{work_key}.json'
    try:
        work_response = requests.get(work_url)
        if work_response.status_code == 200:
            work_data = work_response.json()
            description = work_data.get('description')
            if isinstance(description, dict):
                return description.get('value')
            elif isinstance(description, str):
                return description
    except Exception:
        pass
    return None


"""
Helper function to get response from Open Library API based on query parameter.
Returns a JSON response with search results.
"""
def get_response(request):
    query = request.GET.get('query', '')
    if not query:
        return JsonResponse({'error': 'Query parameter is required'}, status=400)

    url = 'https://openlibrary.org/search.json'
    params = {'q': query}
    response = requests.get(url, params=params)
    
    if response.status_code != 200:
        return JsonResponse({'error': 'Failed to fetch data from Open Library'}, status=response.status_code)

    data = response.json()
    return data


"""
Search for books using Open Library API.
Returns a JSON response with a list of books.
"""
@api_view(['GET'])
def search_books(request):
    data = get_response(request)
    books = []
    for book in data.get('docs', [])[:10]:
        work_key = book.get('key')
        books.append({
            'title': book.get('title'),
            'author': book.get('author_name', ['Unknown'])[0],
            'year': book.get('first_publish_year'),
            'cover_id': book.get('cover_i'),
            'key': work_key,
        })
    return JsonResponse({'books': books})


"""
Get details of a specific book using Open Library API.
Returns a JSON response with book details.
"""
@api_view(['GET'])
def get_book(request):
    data = get_response(request)
    books = []
    for book in data.get('docs', [])[:1]:
        work_key = book.get('key')
        books.append({
            'title': book.get('title'),
            'author': book.get('author_name', ['Unknown'])[0],
            'year': book.get('first_publish_year'),
            'cover_id': book.get('cover_i'),
            'key': work_key,
            'description': get_description(work_key)
        })
    return JsonResponse({'books': books})

"""
Creates user in database. 
"""
@api_view(['POST'])
def create_user(request):
    data = json.loads(request.body)
    if not data: 
        return JsonResponse({'message': 'Error :()'}, status=400)
    
    if BookUser.objects.filter(username=data.get('userName')).exists():
        return JsonResponse({'message': 'User already exists'}, status=400)

    user = BookUser.objects.create_user(
        username = data.get('userName'),
        password = data.get('password')
    )

    print(f"Created user: {user.username}, ID: {user.id}")

    user = authenticate(request, username = data.get("userName"), password = data.get("password"))
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        accessToken = str(refresh.access_token)
        shelf = BookShelf(user = user, title = "CurrentlyReading")
        shelf.save()
        shelfRead = BookShelf(user = user, title = "Read")
        shelfRead.save()

        return JsonResponse({
            'message': 'User created successfully', 
            'token': accessToken}, 
            status=200)
    else: 
        return JsonResponse({'message': 'Error in authentication'}, status=400)


@api_view(['POST'])
def sign_in(request):
    data = json.loads(request.body)
    if not data: 
        return JsonResponse({'message': 'Error'}, status=400)

    user = authenticate(request, username = data.get("userName"), password = data.get("password"))

    if not user: 
        return JsonResponse({'message': 'No account detected'}, status=400)
    
    refresh = RefreshToken.for_user(user)
    accessToken = str(refresh.access_token)
    
    return JsonResponse({
        'message': 'Success signing in', 
        'token': accessToken}, 
        status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_by_token(request):
    user = request.user

    if isinstance(user, AnonymousUser):
        return JsonResponse({'message': 'User is not authenticated'}, status=401)

    user_data = {
        "username": user.username,
        "profile_url": getattr(user, 'profile_url', ''),  
        "description": getattr(user, 'description', ''),
    }
    return JsonResponse({'message': 'Success getting user', 'data': user_data}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_by_name(request):
    username = request.GET.get('userName')
    if not username: 
        return JsonResponse({'message': 'Error: No body'}, status=400)

    try: 
        user = BookUser.objects.get(username = username)

    except ModuleNotFoundError:
        return JsonResponse({'message': 'Module not found'}, status=404)

    user_data = {
        "username": user.username,
        "profile_url": getattr(user, 'profile_url', ''),  
        "description": getattr(user, 'description', ''),
    }
    return JsonResponse({'message': 'Success getting user', 'user': user_data}, status=200)



@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Update user profile information including username, description, profile URL and password
    """
    data = json.loads(request.body)
    if not data:
        return JsonResponse({'message': 'No data provided'}, status=400)
    
    user = request.user
    
    if 'username' in data and data['username'] != user.username:
        if BookUser.objects.filter(username=data['username']).exclude(id=user.id).exists():
            return JsonResponse({'message': 'Username already exists'}, status=400)
        user.username = data['username']
    
    if 'profile_url' in data:
        user.profile_url = data['profile_url']
    
    if 'description' in data:
        user.description = data['description']
    
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    
    user.save()
    
    user_data = {
        "username": user.username,
        "profile_url": getattr(user, 'profile_url', ''),
        "description": getattr(user, 'description', ''),
    }
    
    return JsonResponse({'message': 'Profile updated successfully', 'data': user_data}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    letters = request.GET.get('userName')
    users = BookUser.objects.all()
    if not letters: 
        user_list = [
            {
                "username": user.username,
                "profile_url": user.profile_url,
                "description": user.description,
            }
            for user in users
        ]
        return JsonResponse({'message': 'Success getting all users', 'users': user_list}, status=200)

    try: 
        users = BookUser.objects.filter(username__istartswith=letters)

    except ModuleNotFoundError:
        return JsonResponse({'message': 'No such user'}, status=400)

    user_list = [
        {
            "username": user.username,
            "profile_url": user.profile_url,
            "description": user.description,
        }
        for user in users
    ]
    return JsonResponse({'message': 'Success getting user', 'users': user_list}, status=200)


@permission_classes([IsAuthenticated])
@api_view(['POST'])
def change_user(request):
    data = json.loads(request.body)
    if not data: 
        return JsonResponse({'message': 'Error'}, status=400)
    
    book, created = Book.objects.get_or_create(
        key = data.get('key'),
        defaults={"title": data.get("title"), 
                  "author": data.get("author"), 
                  "year": data.get("year"), 
                  "url": data.get("url")}
    )
    try: 
        shelf = BookShelf.objects.get(
            title = data.get("shelfTitle"), 
            user = data.get("user")
            )
        shelf.add(book)
    except ModuleNotFoundError:
        return JsonResponse({'message': 'Module not found'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    user = request.user

    if isinstance(user, AnonymousUser):
        return JsonResponse({'message': 'User is not authenticated'}, status=401)

    user_list = [
        {
            "username": friend.username,
            "profile_url": friend.profile_url,
        }
        for friend in user.friends.all()
    ]
    return JsonResponse({'message': 'Success getting user', 'friends': user_list}, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_friend(request):
    data = json.loads(request.body)
    if not data: 
        return JsonResponse({'message': 'Error'}, status=400)

    try: 
        friend = BookUser.objects.get(username = data.get("userName"))
        user = request.user

    except ModuleNotFoundError:
        return JsonResponse({'message': 'Module not found'}, status=404)

    if isinstance(user, AnonymousUser):
        return JsonResponse({'message': 'User is not authenticated'}, status=401)
    
    user.friends.add(friend)

    return JsonResponse({'message': 'Successfully added friend!'}, status=200)



@permission_classes([IsAuthenticated])
@api_view(['POST'])
def add_book_to_db(request):
    try:
        data = json.loads(request.body)
        if not data: 
            return JsonResponse({'message': 'Error: No data provided'}, status=400)
        
        required_fields = ['key', 'title', 'author', 'year']
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return JsonResponse({'message': f"Missing fields: {', '.join(missing)}"}, status=400)
        
        book, created = Book.objects.get_or_create(
            key = data.get('key'),
            defaults={
                "title": data.get("title"), 
                "author": data.get("author"), 
                "year": data.get("year"), 
                "url": data.get("url") or "https://via.placeholder.com/250x400?text=No+Cover+Available"
            }
        )
        if created: 
            return JsonResponse({'message': 'Book added successfully'}, status=200)
        return JsonResponse({'message': 'Book already exists in database'}, status=200)
    
    except Exception as e:
        return JsonResponse({'message': f'Server error: {str(e)}'}, status=500)
    

@permission_classes([IsAuthenticated])
@api_view(['POST'])
def check_book(request):
    data = json.loads(request.body)
    if not data: 
        return JsonResponse({'message': 'Error'}, status=400)
    try: 
        shelf = BookShelf.objects.get(
            title = "CurrentlyReading", 
            user = request.user
        )
        if(shelf.books.filter(key=data.get("key")).exists()):
            return JsonResponse({'message': 'Success checking book', 'data': 'CurrentlyReading'}, status=200)
        shelf = BookShelf.objects.get(
            title = "Read", 
            user = request.user
        )
        if(shelf.books.filter(key=data.get("key")).exists()):
            return JsonResponse({'message': 'Success checking book', 'data': 'Read', 'shelf': shelf.title}, status=200)
        else:
            return JsonResponse({'message': 'Success checking book', 'data': 'No', 'shelf': shelf.title}, status=200)
    except ModuleNotFoundError:
        return JsonResponse({'message': 'Module not found'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shelf_for_user(request):
    user = request.user
    shelves = BookShelf.objects.filter(user=user)
    shelf_list = [
        {
            'books': list(shelf.books.values('title', 'url', 'key')),
            'title': shelf.title,
        }
        for shelf in shelves
    ]
    return JsonResponse({'message': 'Success getting shelves', 'shelves': shelf_list}, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shelf_from_username(request):
    user_name = request.GET.get('query')
    user = BookUser.objects.get(username = user_name)
    shelves = BookShelf.objects.filter(user=user)
    shelf_list = [
        {
            'books': list(shelf.books.values('title', 'url', 'key')),
            'title': shelf.title,
        }
        for shelf in shelves
    ]
    return JsonResponse({'message': 'Success getting shelves', 'shelves': shelf_list}, status=200)


@permission_classes([IsAuthenticated])
@api_view(['POST'])
def add_book_to_shelf(request):
    try:
        data = json.loads(request.body)
        if not data: 
            return JsonResponse({'message': 'Error: No data provided'}, status=400)
        
        required_fields = ['key', 'title', 'author', 'year', 'shelf']
        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            return JsonResponse({'message': f"Missing fields: {', '.join(missing)}"}, status=400)
        
        book, created = Book.objects.get_or_create(
            key = data.get('key'),
            defaults={
                "title": data.get("title"), 
                "author": data.get("author"), 
                "year": data.get("year"), 
                "url": data.get("url") or "https://via.placeholder.com/250x400?text=No+Cover+Available"
            }
        )
        shelf_title = data.get("shelf")
        shelf = BookShelf.objects.get(
            title = shelf_title, 
            user = request.user
        )
        shelf.books.add(book)

        if shelf_title == "Read":
            action = "marked_read"
        elif shelf_title == "CurrentlyReading":
            action = "marked_current"
        else:
            action = "added_to_shelf"
        Activity.objects.create(user=request.user, book=book, action=action, shelf_title=shelf_title)
        return JsonResponse({'message': 'Book added to shelf successfully'}, status=200)
    
    except BookShelf.DoesNotExist:
        return JsonResponse({'message': f"Shelf '{data.get('shelf')}' not found"}, status=404)
    except Exception as e:
        print(f"Error adding book to shelf: {str(e)}")
        return JsonResponse({'message': f'Server error: {str(e)}'}, status=500)
    

@permission_classes([IsAuthenticated])
@api_view(['POST'])
def add_shelf(request):
    data = json.loads(request.body)
    if not data: 
        return JsonResponse({'message': 'Error: No data provided'}, status=400)

    shelf_title = data.get("shelf")

    shelf, created = BookShelf.objects.get_or_create(
        title = shelf_title, 
        user = request.user
    )
    if created: 
        return JsonResponse({'message': 'Shelf created successfully', 'shelf': shelf.title}, status=200)

    return JsonResponse({'message': 'Shelf already exists'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reviews_for_book(request):
    bookKey = request.GET.get('query')
    allbooks = Book.objects.all()
    titles = [book.key for book in allbooks]
    #return JsonResponse({'message': 'Bokkey:','reviews': bookKey, 'allbooks:': titles}, status=200)
    book = Book.objects.get(key = bookKey)
    reviews = book.reviews.all()
    review_list = [
        {
            'content': review.content,
            'user': review.user.username,
            'profile_url': review.user.profile_url,
            'title': review.title,
            'rating': review.rating,
        }
        for review in reviews
    ]
    review_list.reverse()
    return JsonResponse({'message': 'Success getting shelves','reviews': review_list}, status=200)


@permission_classes([IsAuthenticated])
@api_view(['POST'])
def submit_review(request):
    data = json.loads(request.body)
    user = request.user
    if not data: 
        return JsonResponse({'message': 'Error'}, status=400)
    book = Book.objects.get(key = data.get('book'))
    review = Reviews(content = data.get("content"), title = data.get("title"), user = user, book = book, rating = data.get("rating", 0))
    review.save()
    return JsonResponse({'message': 'Success posting review'}, status=200)


@permission_classes([IsAuthenticated])
@api_view(['GET'])
def get_user_reviews(request):
    user = request.user
    reviews = Reviews.objects.filter(user=user)
    serializer = ReviewSerializer(reviews, many=True)
    return JsonResponse({"reviews": serializer.data})


@permission_classes([IsAuthenticated])
@api_view(['GET'])
def get_feed(request):
    """
    Get the activity feed for the authenticated user.
    Returns a JSON response with the user's activities.
    """
    user = BookUser.objects.get(username=request.user)
    friends = user.friends.all()
    users = [user] + list(friends)

    activities = Activity.objects.filter(user__in=users).select_related('book', 'user').order_by('-timestamp')[:50]
    
    feed = []
    for activity in activities:
        feed.append({
            'username': activity.user.username,
            'profile_pic': activity.user.profile_url,
            'book_title': activity.book.title,
            'book_image': activity.book.url,
            'action': activity.action,
            'timestamp': activity.timestamp.isoformat(),
            'shelf_title': activity.shelf_title
        })
    
    return JsonResponse({'message': 'Success getting feed', 'feed': feed}, status=200)


@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({'detail': 'CSRF cookie set'})
