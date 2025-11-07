import { React , useEffect, useState } from 'react';
import './App.css';
import Nav from './Nav';

function Home() {
    const csrfToken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
    if (!csrfToken) {console.error('CSRF token is missing!');}

    const [feed, setFeed] = useState([]);

    useEffect(() => {
    fetch('http://localhost:8000/betterReads/feed/', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
        },
    })
    .then(async res => {
        const contentType = res.headers.get('content-type');
        const text = await res.text();

        if (!res.ok) {
            console.error(`Error ${res.status}:`, text);
            throw new Error(`Server responded with status ${res.status}`);
        }

        if (!contentType || !contentType.includes('application/json')) {
            console.error('Expected JSON but got:', text);
            throw new Error('Response was not JSON');
        }

        return JSON.parse(text);
    })
    .then(data => setFeed(data.feed))
    .catch(err => console.error('Error fetching feed:', err));
}, []);


    const renderActionText = (item) => {
        console.log(item);
        if (item.action === 'marked_read') {
            return `${item.username} finished reading ${item.book_title}`;
        } else if (item.action === 'marked_current') {
            return `${item.username} started reading ${item.book_title}`;
        } else {
            return `${item.username} added ${item.book_title} to shelf "${item.shelf_title}"`;
        }
    }

    return(
        <div className='App'>
            <Nav />
            <div className="feed-container">
                <h2 className='feed-heading'>Feed</h2>
                <div className="feed">
                    {feed.map((item, index) => (
                        <div key={index} className="feed-item">
                            <div className='profile-pic-container'>
                                <img src={item.profile_pic} alt="Profile" className="profile-pic" />
                            </div>
                            <div className='feed-content'>
                                <div className='feed-header'>
                                    <span className='action-text'>{renderActionText(item)}</span>
                                </div>
                                <div className='book-details'>
                                    <img src={item.book_image} alt="Book Cover" className="book-cover-feed" />
                                    <span><strong>{item.book_title}</strong>
                                    {item.shelf_title && <span className='shelf-title'> → {item.shelf_title}</span>}</span>
                                   
                                </div>
                                <p className="timestamp">{new Date(item.timestamp).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
    );
}

export default Home;
