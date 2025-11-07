import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './addfriend.css';

function SearchFriends() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();
    const debounceTimeout = useRef(null);

  //Send cookie for CSRF
  useEffect(() => {
    fetch('http://localhost:8000/betterReads/get-csrf/', {credentials: 'include',})
    .then(res => {console.log('Fetched CSRF cookie');})
    .catch(err => {console.error('Failed to fetch CSRF cookie', err);});
  }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const currentUser = localStorage.getItem('userName');

        if (query.length > 1) {
            clearTimeout(debounceTimeout.current);

            debounceTimeout.current = setTimeout(async () => {
                setLoading(true);
                try {
                    const response = await fetch(`http://localhost:8000/betterReads/search_users/?userName=${encodeURIComponent(query)}`, {
                        method: 'GET', 
                        headers: {
                          'Content-Type': 'application/json', 
                          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        }, 
                        credentials: 'same-origin',
                    })
                    const data = await response.json();
                    let users = Array.isArray(data.users) ? data.users : [];
                    users = users.filter(user => user.username !== currentUser); 
                    setResults(users);
                    setShowDropdown(users.length > 0);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Error fetching data:', error);
                    }
                } finally {
                    setLoading(false);
                }
            }, 150);
        } else {
            setResults([]);
            setShowDropdown(false);
        }

        return () => {
            clearTimeout(debounceTimeout.current);
            controller.abort();
        };
    }, [query]);

    const handleChange = (e) => {
        setQuery(e.target.value);
    };

    const handleSelect = (user) => {
        setQuery('');
        setShowDropdown(false);
        console.log("Selected user:", user);
        
        navigate(`/user/profile/${user.username}`); 
    };

    return (
        <div className="search" ref={wrapperRef}>
            <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Search for users..."
            />
            {loading && <div className="loading-spinner" />}

            {showDropdown && results.length > 0 && (
                <ul className="search-results">
                    {results.map((user) => (
                        <li key={user.username} onClick={() => handleSelect(user)}>
                        <img src={user.profile_url} className="profile-picture" alt="Friends profile"/>
                        <div>
                            <strong>{user.username}</strong>
                        </div>
                    </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SearchFriends;
