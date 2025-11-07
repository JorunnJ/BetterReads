import logo from './logo.svg';
import './profile.css';
import { Avatar } from 'primereact/avatar';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import Nav from './Nav';
import './profile.css';

function EditProfile() {
    
  let navigate = useNavigate(); 
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    userName: '',
    url: '',
    description: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async(event) => {
    event.preventDefault();

    // Get the CSRF token from the cookie
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    if (!csrfToken) {
      console.error('CSRF token is missing!');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    // Create the payload with proper field names
    const payload = {
      username: formData.userName, // Changed from userName to username
      description: formData.description,
      profile_url: formData.url
    };

    // Only include password if it's not empty
    if (formData.password) {
      payload.password = formData.password;
    }

    console.log("Submitting:", payload);

    try {
      // Make sure the endpoint matches what's defined in your backend
      const response = await fetch('http://localhost:8000/betterReads/user_profile/', { // Changed to a more likely endpoint
        method: 'PUT', 
        headers: {
          'Content-Type': 'application/json', 
          'X-CSRFToken': csrfToken,
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }, 
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      // For debugging
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
        alert("Profile updated successfully!");
        navigate('/Profile');
      } else {
        alert(`Failed to update profile: ${data.message || data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    }
  };

  const handleChange = (event) => {
    const value = event.target.value;
    const name = event.target.name; 
    setFormData((prevData) => ({
      ...prevData, 
      [name]: value
    }));
  };

  useEffect(() => {
    // Fetch CSRF token
    fetch('http://localhost:8000/betterReads/get-csrf/', {
      credentials: 'include',
    })
    .then(res => {
      console.log('Fetched CSRF cookie');
    })
    .catch(err => {
      console.error('Failed to fetch CSRF cookie', err);
    });
    
    // Get user data
    getUser();
  }, []);

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        userName: user.username || '',
        url: user.profile_url || '', // Changed from user.url to user.profile_url
        description: user.description || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const getUser = async () => {
    try {
      const response = await fetch('http://localhost:8000/betterReads/get_user_by_token/', {  // Changed endpoint URL
        method: 'GET', 
        headers: {
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }, 
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const data = await response.json();
      setUser(data.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  return (
    <div className="App">
      <Nav />
      <div className="Body">
        <div className="profileInfo">
          <h2>Edit Profile</h2>
          {user ? (
            <>
              <Avatar image={user.profile_url} className='profile-avatar' />
              <h3>{user.username}</h3>
              
              <form className='profile-form' onSubmit={handleSubmit}>
                <div className='form-group'>
                  <label htmlFor="userName">Username</label>
                  <input 
                    type="text" 
                    name="userName" 
                    value={formData.userName}
                    onChange={handleChange} 
                    placeholder="Username"
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor="url">Profile Image URL</label>
                  <input 
                    type="text" 
                    name="url" 
                    value={formData.url}
                    onChange={handleChange} 
                    placeholder="Image URL"
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor="description">Description</label>
                  <textarea 
                    name="description" 
                    value={formData.description}
                    onChange={handleChange} 
                    placeholder="Tell us about yourself"
                    rows="4"
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor="password">New Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password}
                    onChange={handleChange} 
                    placeholder="Leave blank to keep current password"
                  />
                </div>

                <div className='form-group'>
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword}
                    onChange={handleChange} 
                    placeholder="Confirm new password"
                  />
                </div>

                <div className="button-group">
                  <button type="submit" className="update-button">Update Profile</button>
                  <button type="button" className="cancel-button" onClick={() => navigate('/Profile')}>Cancel</button>
                </div>
              </form>
            </>
          ) : ( 
            <p>Loading user information...</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditProfile;
