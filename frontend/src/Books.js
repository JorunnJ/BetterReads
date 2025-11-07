import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Search.css';

function BookSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();
    const debounceTimeout = useRef(null);

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

        if (query.length > 1) {
            clearTimeout(debounceTimeout.current);

            debounceTimeout.current = setTimeout(async () => {
                setLoading(true);
                try {
                    const response = await fetch(
                        `http://localhost:8000/betterReads/search/?query=${query}`,
                        { signal: controller.signal }
                    );
                    const data = await response.json();
                    const books = Array.isArray(data.books) ? data.books : [];
                    setResults(books);
                    setShowDropdown(books.length > 0);
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

    const handleSelect = (book) => {
        setQuery('');
        setShowDropdown(false);
        console.log("Selected book:", book);
        
        if (book.key) {
            navigate(`/book${book.key}`); 
        } else if (book.isbn) {
            navigate(`/book/isbn/${book.isbn}`);
        } else {
            navigate(`/book/title/${encodeURIComponent(book.title)}`);
        }
    };

    return (
        <div className="search" ref={wrapperRef}>
            <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Search for books..."
            />
            {loading && <div className="loading-spinner" />}

            {showDropdown && results.length > 0 && (
                <ul className="search-results">
                    {results.map((book) => (
                        <li key={book.isbn || book.title} onClick={() => handleSelect(book)}>
                        <img
                            src={book.cover_id
                                ? `https://covers.openlibrary.org/b/id/${book.cover_id}-S.jpg`
                                : 'https://via.placeholder.com/40x60?text=No+Cover'}
                            alt={book.title}
                            className="book-cover"
                        />
                        <div>
                            <strong>{book.title}</strong>
                            <p>{book.author}</p>
                        </div>
                    </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default BookSearch;
