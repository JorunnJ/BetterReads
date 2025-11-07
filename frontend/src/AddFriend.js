import 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import Nav from './Nav';
import SearchFriends from './searchFriends';


function Profiles() {
  let navigate = useNavigate(); 
  const [results, setResults] = useState([]);
  
  //Fetch cookie for CSRF
  useEffect(() => {
    fetch('http://localhost:8000/betterReads/get-csrf/', {credentials: 'include',})
    .then(res => {console.log('Fetched CSRF cookie');})
    .catch(err => {console.error('Failed to fetch CSRF cookie', err);});
    //getShelves();
    getFriends();
  }, []);

  /**
   * Gets all friends for user. 
   */
  const getFriends = async () =>{
    // Get the CSRF token from the cookie
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    if (!csrfToken) {console.error('CSRF token is missing!');}

    const response = await fetch('http://localhost:8000/betterReads/get_friends/', {
      method: 'GET', 
      headers: {
        'Content-Type': 'application/json', 
        'X-CSRFToken': csrfToken,
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }, 
      credentials: 'include'
    })
    const data = await response.json();
    console.log(response.ok)
    const friends = Array.isArray(data.friends) ? data.friends : [];
    setResults(friends);
  }


  const handleSelect = (user) => {
    console.log("Selected user:", user);
    navigate(`/user/profile/${user}`); 
  };


  return (
    <div className="App">
      <Nav />
      <div className="Body">
        <div className="search-friends">
            <h2>Search for new friends!</h2>
            <SearchFriends/>
        </div>
        
        <div className='friends-list'>
          <h2>Your Friends</h2>
            {results.length === 0 ? (
              <p>You have no friends.</p>
            ) : (
              <ul className="friends">
                {results.map((friend) => (
                    <li key={friend.username} onClick={() => handleSelect(friend.username)} className='friend'>
                      <img src={friend.profile_url} className="profile-picture" alt="Friends profiles"/>
                      <div>
                        <strong>{friend.username}</strong>
                      </div>
                    </li>
                ))}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
}

export default Profiles;
