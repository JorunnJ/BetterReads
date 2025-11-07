import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import EditProfile from './EditProfile';
import Profile from './Profile';
import BookSearch from './Books';
import Home from './Home';
import SignUp from './SignUp';
import SignIn from './SignIn';
import AddFriend from './AddFriend';
import BookDetails from './BookDetails';
import Friend from './Friend';


//Contains all routes
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element = {<SignIn />} />
        <Route path="/signin" element = {<SignIn />} />
        <Route path="/signup" element = {<SignUp />} />
        <Route path="editProfile" element={<EditProfile />} />
        <Route path="/search" element={<BookSearch />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/home" element={<Home />} />
        <Route path="/searchusers" element={<AddFriend />} />
        <Route path="/book/title/:title" element={<BookDetails />} /> 
        <Route path="/book/:id" element={<BookDetails />} />
        <Route path="/book/works/:id" element={<BookDetails />} />
        <Route path="/user/profile/:username" element={<Friend />} /> 

      </Routes>
    </Router>
  );
}

export default App;
