import './profile.css';
import 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from "react";
import Nav from './Nav';

function Profiles() {

  let navigate = useNavigate(); 
  const [user, setUser] = useState(null);
  const [shelves, setShelves] = useState(null); 
  const [reviews, setReviews] = useState([]); 
  const [newShelfTitle, setNewShelfTitle] = useState([]); 

  //Fetch cookie for CSRF
  useEffect(() => {
    fetch('http://localhost:8000/betterReads/get-csrf/', {credentials: 'include',})
      .then(res => {console.log('Fetched CSRF cookie');})
      .catch(err => {console.error('Failed to fetch CSRF cookie', err);});
    
    getUser();
    getShelves();
    getReviews(); 
  }, []);


  const getUser = async () => {
    const response = await fetch('http://localhost:8000/betterReads/get_user_by_token/', {
      method: 'GET', 
      headers: {
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }, 
      credentials: 'same-origin'
    })
    const data = await response.json();
    setUser(data.data)
  };


  const getShelves = async () => {
    const response = await fetch('http://localhost:8000/betterReads/get_shelf_for_user/', {
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

  const getReviews = async () => {
  const response = await fetch('http://localhost:8000/betterReads/get_user_reviews/', {
    method: 'GET', 
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }, 
    credentials: 'include'
  });

  const text = await response.text();
  console.log("Raw response from get_user_reviews:", text);

  try {
    const data = JSON.parse(text); 
    setReviews(data.reviews);
  } catch (err) {
    console.error("Could not parse JSON:", err);
  }
}
  
  const getShelfContent = () => {
    let shelfNames = []
    for (let shelfIndex = 0; shelfIndex < shelves.length; shelfIndex++) {
      const shelf = shelves[shelfIndex]
      const books = shelf.books;
      shelfNames.push(
        <div key={shelf.title}>
          <h3>{shelf.title}</h3>
          <ul>
            {books.map((book) => (
              <li key={book.key}>
                <img src={book.url} className="shelf-book-cover" alt="book cover"/>
                <span>{book.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    }
    return shelfNames
  }

  const renderReviews = () => {
    if (reviews.length === 0) {
      return <p>You haven't written any reviews yet.</p>;
    }
    return (
      <ul className="review-list">
        {reviews.map((review, index) => (
          <li key={index} className="review-item">
            <strong>{review.book_title}</strong> – <em>{review.title}</em>
            <p>{review.content}</p>
          </li>
        ))}
      </ul>
    );
  }

  const addNewShelf = async () => {
    // Get the CSRF token from the cookie
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    if (!csrfToken) {console.error('CSRF token is missing!');}
    
    try {
        const response = await fetch('http://localhost:8000/betterReads/add_shelf/', {
          method: 'POST', 
          headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }, 
          body: JSON.stringify({
            shelf: newShelfTitle
          }),
          credentials: 'include'
        });
        
        const data = await response.json();
        if (response.ok) {
          getShelves();
        } else {
            console.error("Error from server:", data.message);
        }
    } catch (error) {
        console.error("Network error:", error);
    }
  }

  return (
    <div className="App">
      <Nav />
      <div className="Body">
        <div className="profileInfo">
          {user ? (
            <>
              <img src={user.profile_url} className='profile-avatar' alt='profile' />
              <div className="user-info">
                <h2>{user.username}</h2>
                <p>{user.description}</p>
              </div>
              <button onClick={() => navigate('/editProfile')}>Edit profile</button>
              
              <div className="stats-section">
                <div className="stat-item">
                  <span className="stat-number">{shelves ? shelves.reduce((acc, shelf) => acc + shelf.books.length, 0) : 0}</span>
                  <span className="stat-label">Books</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{shelves ? shelves.length : 0}</span>
                  <span className="stat-label">Shelves</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{reviews.length}</span> 
                  <span className="stat-label">Reviews</span>
                </div>
              </div>
            </>
          ) : (
            <p>Loading user...</p>
          )}

          <div className="Shelves">
            <div>
              {shelves ? getShelfContent() : <p>Loading shelves...</p>}
            </div>

          </div>
          <div>
            <h3>Add shelf</h3>
            <textarea
              value={newShelfTitle}
              onChange={(e) => setNewShelfTitle(e.target.value)}
              placeholder="Write name of new shelf here"
              rows={1}            
            ></textarea>
            <button onClick={() => addNewShelf()}>Add shelf</button>

          </div>

          <div className="Reviews">
            <h3>Your Reviews</h3>
            {renderReviews()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profiles;
