import './profile.css';
import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { useNavigate } from 'react-router-dom';

<Link to="/dashboard">Dashboard</Link>;

function SignUp() {

  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    repPassword: ''
  });

  const [responseText, setResponseText] = useState(null);
  let navigate = useNavigate();

  //Fetch cookie for CSRF
  useEffect(() => {
    fetch('http://localhost:8000/betterReads/get-csrf/', {
      credentials: 'include',
    })
    .then(res => {
      console.log('Fetched CSRF cookie');
    })
    .catch(err => {
      console.error('Failed to fetch CSRF cookie', err);
    });
    setResponseText(" ");

  }, []);


  /**
   * Creates new user based on the information written in the form. 
   * Also saves the returned access token in the local storage, for access in the future. 
   * @param {*} event 
   */
  const handleSubmit = async(event) => {
    event.preventDefault()
    console.log("Submitting:", formData);

    if (formData.repPassword !== formData.password){
      console.log(formData.repPassword);
      console.log(formData.password);
      setResponseText("Passwords don't match");
      return ;
    }

    if (formData.userName.length < 3){
      console.log(formData.userName);
      console.log(formData.userName);
      setResponseText("Username too short!");
      return ;
    }

    // Get the CSRF token from the cookie
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (!csrfToken) {
      console.error('CSRF token is missing!');
      
    }

    console.log("Submitting:", formData);

    const response = await fetch('http://localhost:8000/betterReads/create-user/', {
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

    if (response.ok){
      navigate('/home')
      localStorage.setItem('accessToken', data.token);
      localStorage.setItem('userName', formData.userName);
    }

    console.log(data);
  }

  /**
   * Updates changes in form.  
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
          <h2>Sign up here!</h2>
          
          <form className='signin-form' onSubmit={handleSubmit}>

            <div className='signin-form-group'>
              <label htmlFor="userName">User name</label>
              <input type="text" name="userName" onChange={handleChange} required/>
            </div>

            <div className='signin-form-group'>
              <label htmlFor="signup-password">Password</label>
              <input type="password" name="password" onChange={handleChange} required/>
            </div>

            <div className='signin-form-group'>
              <label htmlFor="repPassword">Repeat password</label>
              <input type="password" name="repPassword" onChange={handleChange} required/>
            </div>
            <div id="responseText">
              {responseText}
            </div>

            <input type="submit" value="Sign up"/>
          </form>

          <div className='signup-link'>
            <div className="signup-divider">
              <span>Already have an account?</span>
            </div>
            <Link to="/SignIn" className="signup-link-btn">Sign in</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SignUp;






