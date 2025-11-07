import './profile.css';
import { Avatar } from 'primereact/avatar';
import 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import Nav from './Nav';
import { useParams } from 'react-router-dom';



function Friend() {
    
  let navigate = useNavigate(); 
  const[user, setUser] = useState(null);
  const[shelves, setShelves] = useState(null); 
  const { username } = useParams();
  const [reviews, setReviews] = useState([]); 

  //Send cookie for CSRF
  useEffect(() => {
    fetch('http://localhost:8000/betterReads/get-csrf/', {credentials: 'include',})
    .then(res => {console.log('Fetched CSRF cookie');})
    .catch(err => {console.error('Failed to fetch CSRF cookie', err);});
    getUser();
    getShelves();
  }, []);

  const getUser = async () => {
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    if (!csrfToken) {
      console.error('CSRF token is missing!');
    }
    const response = await fetch(`http://localhost:8000/betterReads/get_user_by_name/?userName=${encodeURIComponent(username)}`, {
        method: 'GET', 
        headers: {
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }, 
        credentials: 'same-origin',
    })
    const data = await response.json();
    setUser(data.user)
  };

  const getShelves = async () => {
    const response = await fetch(`http://localhost:8000/betterReads/get_shelf_from_username/?query=${encodeURIComponent(username)}`, {
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

  const addFriend = async (event) =>{
    event.preventDefault()
    // Get the CSRF token from the cookie
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    if (!csrfToken) {console.error('CSRF token is missing!');}

    const response = await fetch('http://localhost:8000/betterReads/add_friend/', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json', 
        'X-CSRFToken': csrfToken,
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }, 
      body: JSON.stringify({
        userName: username, 
      }),
      credentials: 'include'
    })
    const data = await response.json();
    console.log(response.ok)

    if (response.ok){
      alert("Friend added");
    }

  }

  return (
    <div className="App">
      <Nav />
      <div className="Body">
        <div className="profileInfo">
          {user ? (
            <>
              <Avatar image={user.profile_url} className='profile-avatar' />
              <div className="user-info">
                <h2>{user.username}</h2>
                <p>{user.description}</p>
              </div>
              <button onClick={addFriend}>Add friend</button>
              
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
        </div>
        </div>
    </div>
  );
}

export default Friend;