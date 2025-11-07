import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Nav from './Nav';
import './BookDetails.css';

function BookDetails() {
    const { id, title } = useParams();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [source, setSource] = useState('');
    const [CurrentlyReading, setCurrentlyReading] = useState('Mark as Currently Reading');
    
    const [MarkReadText, setReadingText] = useState('Mark as read');
    const[reviews, setReviews] = useState(null); 
    const[reviewContent, setReviewContent] = useState("");
    const[reviewTitle, setReviewTitle] = useState(""); 
    const [rating, setRating] = useState(0);



    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState("Add to shelf");

    const [shelves, setShelves] = useState(null)


    const handleSelect = (option) => {
         setSelected(option);
         setIsOpen(false);
         addBookToShelf(option);
     }

    //Send cookie for CSRF
    useEffect(() => {fetch('http://localhost:8000/betterReads/get-csrf/', {credentials: 'include',})
        .then(res => {console.log('Fetched CSRF cookie');})
        .catch(err => {console.error('Failed to fetch CSRF cookie', err);});
    }, []);


    /**
     * Check if this book has been read by user. 
     */
    const checkReadStatus = async () => {
        const response = await fetch('http://localhost:8000/betterReads/check_book/', {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }, 
          body: JSON.stringify({
            key: book.key,
            shelf: "Favorites"
          }),
          credentials: 'include'
        })
        const data = await response.json();
        if(!response.ok){
            console.log("Data from server: " + data.message)
        }
        else if (data.data == "CurrentlyReading"){
            setCurrentlyReading("CURRENTLY READING")
        }
        else if (data.data == "Read"){
            setReadingText("Read")
        }
        console.log(data)
    }

    /**
     * Fetching details about book from Open Library API. 
     */
    useEffect(() => {
        const fetchBook = async () => {
            try {
                if (title) {
                    console.log("Searching by title:", title);
                    
                    const searchRes = await fetch(`http://localhost:8000/betterReads/search/?query=${encodeURIComponent(title)}`);
                    const searchData = await searchRes.json();
                    
                    if (searchRes.ok && searchData.books && searchData.books.length > 0) {
                        console.log("Found book in local search:", searchData.books[0]);
                        setBook(searchData.books[0]);
                        setSource('internal');
                        return;
                    }
                    
                    const olSearchRes = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`);
                    const olSearchData = await olSearchRes.json();
                    
                    if (olSearchRes.ok && olSearchData.docs && olSearchData.docs.length > 0) {
                        console.log("Found in Open Library search:", olSearchData.docs[0]);
                        
                        const bookKey = olSearchData.docs[0].key;
                        if (!bookKey) {
                            throw new Error('Open Library search result missing key');
                        }
                        
                        const bookRes = await fetch(`https://openlibrary.org${bookKey}.json`);
                        if (!bookRes.ok) {
                            throw new Error('Failed to fetch book details from Open Library');
                        }
                        
                        const bookData = await bookRes.json();
                        console.log("Open Library book details:", bookData);
                        setBook({
                            ...bookData,
                            author: olSearchData.docs[0].author_name ? olSearchData.docs[0].author_name[0] : 'Unknown',
                            covers: olSearchData.docs[0].cover_i ? [olSearchData.docs[0].cover_i] : [],
                            first_publish_year: olSearchData.docs[0].first_publish_year ?? 'Unknown',   
                            key: bookKey
                        });
                        setSource('openlibrary');
                        return;
                    }
                    
                    throw new Error(`No book found with title: ${title}`);
                }

                console.log("Fetching book with ID:", id);
                
                if (id) {
                    const bookTitle = "works/" + id;
                    console.log("Searching by title:", bookTitle);
                    
                    const searchRes = await fetch(`http://localhost:8000/betterReads/get_book/?query=${encodeURIComponent(bookTitle)}`);
                    const searchData = await searchRes.json();
                    
                    if (searchRes.ok && searchData.books && searchData.books.length > 0) {
                        console.log("Found book in local search:", searchData.books[0]);
                        setBook(searchData.books[0]);
                        setSource('internal');
                        return;
                    }
                    
                    const olSearchRes = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(bookTitle)}`);
                    const olSearchData = await olSearchRes.json();
                    
                    if (olSearchRes.ok && olSearchData.docs && olSearchData.docs.length > 0) {
                        console.log("Found in Open Library search:", olSearchData.docs[0]);
                        
                        const bookKey = olSearchData.docs[0].key;
                        if (!bookKey) {
                            throw new Error('Open Library search result missing key');
                        }
                        
                        const bookRes = await fetch(`https://openlibrary.org${bookKey}.json`);
                        if (!bookRes.ok) {
                            throw new Error('Failed to fetch book details from Open Library');
                        }
                        
                        const bookData = await bookRes.json();
                        console.log("Open Library book details:", bookData);
                        setBook({
                            ...bookData,
                            author: olSearchData.docs[0].author_name ? olSearchData.docs[0].author_name[0] : 'Unknown',
                            covers: olSearchData.docs[0].cover_i ? [olSearchData.docs[0].cover_i] : [],
                            first_publish_year: olSearchData.docs[0].first_publish_year ?? 'Unknown', 
                            key: bookKey
                        });
                        setSource('openlibrary');
                        return;
                    }
                    
                    throw new Error(`No book found with title: ${bookTitle}`);
                } 
                
                try {
                    const localRes = await fetch(`http://localhost:8000/betterReads/book/${encodeURIComponent(id)}`);
                    if (localRes.ok) {
                        const localData = await localRes.json();
                        setBook(localData);
                        setSource('internal');
                        return;
                    }
                } catch (localErr) {
                    console.log("Local database fetch failed:", localErr);
                }
                
                try {
                    const apiRes = await fetch(`https://openlibrary.org${id}.json`);
                    if (apiRes.ok) {
                        const apiData = await apiRes.json();
                        setBook(apiData);
                        setSource('openlibrary');
                        return;
                    }
                } catch (apiErr) {
                    console.log("Open Library API fetch failed:", apiErr);
                }
                
                throw new Error('Book not found in any source.');
                
            } catch (err) {
                console.error("Error fetching book:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBook();
    }, [id, title]);

    useEffect( () => {
        if(book && book.key){
            const addBook = async () => {
                await addBookToDB();
                checkReadStatus();
                getReviewsForBook();
                getShelves();
            }
            addBook();

        }
        
    },[book]);

    if (loading) return (
        <div className='App'>
            <Nav />
            <div className="book-details">
                <p className="loading">Loading book details...</p>
            </div>
        </div>
       
    );
    
    if (error) return (
        <div className='App'>
            <Nav />
            <div className="book-details">
                <p className="error">Error: {error}</p>
            </div>
        </div>
    );
    
    if (!book) return (
        <div className='App'>
            <Nav />
            <div className="book-details">
                <p>No book data found.</p>
            </div>
        </div>
    );

    const coverUrl = source === 'openlibrary' && book.covers && book.covers.length > 0
        ? `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`
        : source === 'internal' && book.cover_id
        ? `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`
        : 'https://via.placeholder.com/250x400?text=No+Cover+Available';

    const description = book.description
        ? typeof book.description === 'string'
            ? book.description
            : book.description.value || ''
        : 'No description available.';

    const subjects = book.subjects || [];


    /**
     * Gets all shelves for this user. 
     */
    const getShelves = async ()=>{
        const response = await fetch(`http://localhost:8000/betterReads/get_shelf_for_user/`, {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }, 
            credentials: 'include'
            })
        const data = await response.json();
        console.log("data", data)
        setShelves(data.shelves);
    }

    /**
     * Add this book to database. 
     */
    const addBookToDB = async () => {
        const year = book.year || book.first_publish_year || 'Unknown';
        
        try {
            const response = await fetch('http://localhost:8000/betterReads/add_book_to_db/', {
              method: 'POST', 
              headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              }, 
              body: JSON.stringify({
                key: book.key,
                title: book.title, 
                author: book.author, 
                year: year, 
                url: coverUrl, 
              }),
              credentials: 'include'
            });
            
            const data = await response.json();
            if (!response.ok){
                console.error("Error from server:", data.message);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const addBookToRead = async (book) => {
        console.log("Adding book as read:", book);
        const year = book.year || book.first_publish_year || 'Unknown';
        
        try {
            const response = await fetch('http://localhost:8000/betterReads/add_book_to_shelf/', {
              method: 'POST', 
              headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              }, 
              body: JSON.stringify({
                key: book.key,
                title: book.title, 
                author: book.author, 
                year: year, 
                url: coverUrl, 
                shelf: "Read"
              }),
              credentials: 'include'
            });
            
            const data = await response.json();
            if (response.ok) {
                setReadingText("Read");
            } else {
                console.error("Error from server:", data.message);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const addBookToCurrentlyReading = async (book) => {
        const year = book.year || book.first_publish_year || 'Unknown';
        
        try {
            const response = await fetch('http://localhost:8000/betterReads/add_book_to_shelf/', {
              method: 'POST', 
              headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              }, 
              body: JSON.stringify({
                key: book.key,
                title: book.title, 
                author: book.author, 
                year: year, 
                url: coverUrl, 
                shelf: "CurrentlyReading"
              }),
              credentials: 'include'
            });
            
            const data = await response.json();
            if (response.ok) {
                setCurrentlyReading("Currently Reading");
            } else {
                console.error("Error from server:", data.message);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    const addBookToShelf = async (option) => {
        const year = book.year || book.first_publish_year || 'Unknown';
        
        try {
            const response = await fetch('http://localhost:8000/betterReads/add_book_to_shelf/', {
                method: 'POST', 
                headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }, 
                body: JSON.stringify({
                key: book.key,
                title: book.title, 
                author: book.author, 
                year: year, 
                url: coverUrl, 
                shelf: option
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            if (response.ok) {
                setCurrentlyReading("Currently Reading");
            } else {
                console.error("Error from server:", data.message);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };
    

    /**
     * Gets all review for this book from the database. 
     */
    const getReviewsForBook = async () => {
            // Get the CSRF token from the cookie
        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
        if (!csrfToken) {console.error('CSRF token is missing!');}
        
        const response = await fetch(`http://localhost:8000/betterReads/get_reviews_for_book/?query=${encodeURIComponent(book.key)}`, {
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }, 
            credentials: 'include'
        })
        const data = await response.json();
        console.log("data", data)
        setReviews(data.reviews);
        
    }

    const showReviews = () => {
        if (!reviews || reviews.length === 0) return <p>No reviews yet.</p>;
        console.log("Review rating:", reviews[0].rating, typeof reviews[0].rating);


        return (
            <div className="review-list">
            {reviews.map((review, index) => (
                <div key={index} className="review-item">
                <div className="review-header">
                    <div className="review-user">
                    <img
                        src={review.profile_url || "/default-profile.png"}
                        alt="Profile"
                        className="review-pic"
                    />
                    <span className="review-username">{review.user.username || review.user}</span>
                    </div>
                </div>
                <div className="review-body">
                    <div className="review-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                            key={star}
                            style={{
                                color: star <= parseInt(review.rating, 10) ? "#ffc107" : "#ccc"
                            }}
                            >
                            ★
                            </span>
                        ))}
                    </div>


                    <h4 className="review-heading">{review.title}</h4>
                    <p className="review-text">{review.content}</p>
                </div>
                </div>
            ))}
            </div>
        );
    }


    /**
     * Submits review written in ReviewContent to Database.  
     */
    const submitReview = async () => {
        try {
            const response = await fetch('http://localhost:8000/betterReads/submit_review/', {
              method: 'POST', 
              headers: {
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
              }, 
              body: JSON.stringify({
                title: reviewTitle,
                content: reviewContent,
                book: book.key,
                author: book.author,
                year: book.year || book.first_publish_year || 'Unknown',
                shelf: "Read",
                rating: rating
                }),
              credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setCurrentlyReading("Currently Reading");
                getReviewsForBook();
            } else {
                console.error("Error from server:", data.message);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
    };

    return (
        <div>
            <Nav />
            <div className="book-details">
                <div className="book-details-container">
                    <div className="book-cover-section">
                        <img src={coverUrl} alt={book.title} className="cover-image" />
                        <div className="book-actions">

                            {/* <button onClick={() => addBookToShelf(book)}>{buttonText}</button> */}
                            <button onClick={() => addBookToRead(book)}>{MarkReadText}</button> 
                            <button onClick={() => addBookToCurrentlyReading(book)}>{CurrentlyReading}</button>
                            {<button onClick={() => {
                                setIsOpen(!isOpen);
                                console.log(isOpen);
                                console.log("Shelves data:", shelves);
                                }}>
                            
                                {selected}</button>}
                            {isOpen && 
                                <div style={{
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    zIndex: 10,
                                    }}>
                                    {shelves.map(shelf => (
                                        <div
                                            key ={shelf.title}
                                            onClick={() => handleSelect(shelf.title)}
                                            onMouseOver={e => e.target.style.backgroundColor = '#bf9b7a'}
                                            onMouseOut={e => e.target.style.backgroundColor = selected === shelf.title ? '#f0f0f0' : 'white'}
                                            >
                                            {shelf.title}

                                        </div>
                                    ))}
                                </div>
                            }
                        </div>
                    </div>
                    
                    <div className="book-info-section">
                        <h1 className="book-title">{book.title}</h1>
                        {book.author && <h2 className="book-author">by {book.author}</h2>}
                        
                        <div className="book-stats">
                            <div>{reviews ? reviews.length : 0} reviews</div>
                        </div>
                        
                        <div className="book-details-section">
                            <h3>Description</h3>
                            <p className="description">{description}</p>
                        </div>
                        
                        <div className="book-details-section">
                            <h3>Book Details</h3>
                            <div className="book-metadata">
                                {book.first_publish_date && (
                                    <div className="metadata-item">
                                        <strong>First published:</strong> {book.first_publish_date}
                                    </div>
                                )}
                                
                                {book.year && (
                                    <div className="metadata-item">
                                        <strong>Published:</strong> {book.year}
                                    </div>
                                )}
                                
                                {book.number_of_pages && (
                                    <div className="metadata-item">
                                        <strong>Pages:</strong> {book.number_of_pages}
                                    </div>
                                )}
                            </div>
                            
                            {subjects.length > 0 && (
                                <div className="subjects">
                                    <strong>Genres:</strong>
                                    <div className="genre-tags">
                                        {subjects.slice(0, 8).map((subject, index) => (
                                            <span key={index} className="genre-tag">{subject}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div id="reviews" className="book-details-section review-section">
                            <h3 className="review-title">Reviews</h3>

                            <div className="review-form">
                                <div className="form-group">
                                    <label htmlFor="rating">Rate</label>
                                    <div className="star-rating">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star}
                                            className={star <= rating ? "filled-star" : "empty-star"}
                                            onClick={() => setRating(star)}
                                            value={star}
                                            style={{ cursor: "pointer", fontSize: "1.5rem", color: star <= rating ? "#ffc107" : "#ccc" }}
                                        >
                                            ★
                                        </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group">
                                <label htmlFor="reviewTitle">Review Title</label>
                                <textarea
                                    id="reviewTitle"
                                    value={reviewTitle}
                                    onChange={(e) => setReviewTitle(e.target.value)}
                                    placeholder="e.g. A powerful and emotional journey"
                                    rows={1}
                                />
                                </div>

                                <div className="form-group">
                                <label htmlFor="reviewContent">Your Thoughts</label>
                                <textarea
                                    id="reviewContent"
                                    value={reviewContent}
                                    onChange={(e) => setReviewContent(e.target.value)}
                                    placeholder="What did you think about the book?"
                                    rows={5}
                                />
                                </div>

                                <button className="submit-review-button" onClick={submitReview}>
                                Submit Review
                                </button>
                            </div>

                            {reviews ? (
                                showReviews()
                            ) : (
                                <p className="loading-reviews">Loading reviews...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookDetails;
