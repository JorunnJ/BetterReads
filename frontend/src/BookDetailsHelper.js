import { useParams } from 'react-router-dom';
import { useState } from 'react';

export function useBookDetails() {
  const { id, title } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('');
  const [currentlyReading, setCurrentlyReading] = useState('Mark as Currently Reading');
  const [markReadText, setReadingText] = useState('Mark as read');
  const [reviews, setReviews] = useState(null);
  const [writeReview, setWriteReview] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewTitle, setReviewTitle] = useState('');

  function getCoverUrl(source) {
    let coverUrl;
    if (source === 'openlibrary' && book?.covers?.length > 0) {
      coverUrl = `https://covers.openlibrary.org/b/id/${book.covers[0]}-L.jpg`;
    } else if (source === 'internal' && book?.cover_id) {
      coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_id}-L.jpg`;
    } else {
      coverUrl = 'https://via.placeholder.com/250x400?text=No+Cover+Available';
    }
    return coverUrl;
  }

  async function addBookToDb(book, source) {
    console.log('Adding book to db:', book);
    const year = book.year || book.first_publish_year || 'Unknown';
    const coverUrl = getCoverUrl(source);

    try {
      const response = await fetch('http://localhost:8000/betterReads/add_book_to_db/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          key: book.key,
          title: book.title,
          author: book.author,
          year: year,
          url: coverUrl,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Error from server:', data.message);
      }
      console.log('BOOK KEY: ', data.data);
    } catch (error) {
      console.error('Network error:', error);
    }
  }

  async function addBookToRead(book, source) {
    console.log('Adding book as read:', book);
    const year = book.year || book.first_publish_year || 'Unknown';
    const coverUrl = getCoverUrl(source);

    try {
      const response = await fetch('http://localhost:8000/betterReads/add_book_to_shelf/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          key: book.key,
          title: book.title,
          author: book.author,
          year: year,
          url: coverUrl,
          shelf: 'Read',
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setReadingText('Read');
      } else {
        console.error('Error from server:', data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  }

  async function addBookToCurrentlyReading(book, source) {
    console.log('Adding book to currently reading:', book);
    const year = book.year || book.first_publish_year || 'Unknown';
    const coverUrl = getCoverUrl(source);

    try {
      const response = await fetch('http://localhost:8000/betterReads/add_book_to_shelf/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          key: book.key,
          title: book.title,
          author: book.author,
          year: year,
          url: coverUrl,
          shelf: 'CurrentlyReading',
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentlyReading('Currently Reading');
      } else {
        console.error('Error from server:', data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  }

  async function getReviewsForBook() {
    if (!book?.key) return;

    try {
      const response = await fetch(
        `http://localhost:8000/betterReads/get_reviews_for_book/?query=${encodeURIComponent(book.key)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          credentials: 'include',
        }
      );

      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Network error:', error);
    }
  }

  async function submitReview(csrfToken) {
    try {
      const response = await fetch('http://localhost:8000/betterReads/submit_review/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
          title: reviewTitle,
          content: reviewContent,
          book: book.key,
        }),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setWriteReview(false);
        getReviewsForBook();
      } else {
        console.error('Error from server:', data.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  }

  return {
    id,
    title,
    book,
    setBook,
    loading,
    setLoading,
    error,
    setError,
    source,
    setSource,
    currentlyReading,
    setCurrentlyReading,
    markReadText,
    setReadingText,
    reviews,
    setReviews,
    writeReview,
    setWriteReview,
    reviewContent,
    setReviewContent,
    reviewTitle,
    setReviewTitle,
    addBookToDb,
    addBookToRead,
    addBookToCurrentlyReading,
    getReviewsForBook,
    submitReview,
  };
}
