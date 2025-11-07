
import './profile.css';
import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useNavigate } from 'react-router-dom';

<Link to="/dashboard">Dashboard</Link>;

function LogIn() {

  const [formData, setFormData] = useState({
    userName: '',
    password: '',
  });

  let navigate = useNavigate();
  
  //Send cookie for CSRF
  useEffect(() => {
    fetch('http://localhost:8000/betterReads/get-csrf/', {credentials: 'include',})
    .then(res => {console.log('Fetched CSRF cookie');})
    .catch(err => {console.error('Failed to fetch CSRF cookie', err);});
  }, []);


  /**
   * Tries to log in user based on the information submitted in form. 
   * If no account with the written credentials can be found in the database, an error message is set. 
   */
  const handleSubmit = async(event) => {
    event.preventDefault()

    // Get the CSRF token from the cookie
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
      if (!csrfToken) {console.error('CSRF token is missing!');}

    console.log("Submitting:", formData);

    const response = await fetch('http://localhost:8000/betterReads/sign_in/', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json', 
        'X-CSRFToken': csrfToken
      }, 
      body: JSON.stringify({
        userName: formData.userName, 
        password: formData.password
      }),
      credentials: 'include'
    })
    const data = await response.json();
    console.log(response.ok)
    console.log(response)

    if (response.ok){
      navigate('/home')
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('userName', formData.userName);
    }

    if(data.message === "No account detected"){
      document.getElementById("responseText").innerText = "No account with this username and password found. Try creating a new account?"
    }
  }


  /**
   * Updates form based on input 
   */
  const handleChange = (event) => {
    const value = event.target.value;
    const name = event.target.name; 
    setFormData((prevData) =>({
      ...prevData, 
      [name]: value
    }))
  }


  return (
    <div className="App">
      <header className="signin">
        <a href="/"><h1>better<b>reads</b></h1></a>
      </header>
      <div>
        <div className="signin">
          <h2>Sign in here!</h2>
          
          <form className='signin-form' onSubmit={handleSubmit}>

            <div className='signin-form-group'>
              <label htmlFor="userName">User name</label>
              <input type="text" name="userName" onChange={handleChange} required/>
            </div>

            <div className='signin-form-group'>
              <label htmlFor="signup-password">Password</label>
              <input type="password" name="password" onChange={handleChange} required/>
            </div>

            <input type="submit" value="Sign in"/>
          </form>

          <div className='signup-link'>
            <div className="signup-divider">
              <span>Don't have an account?</span>
            </div>
            <Link to="/SignUp" className="signup-link-btn">Sign up</Link>
          </div>

          <div >
            <p id='responseText'></p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LogIn;
