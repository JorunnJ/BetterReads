import { React} from 'react';
import './App.css';
import BookSearch from './Books';
import { useNavigate } from 'react-router-dom';

function Nav() {
    let navigate = useNavigate();

    const signOut = async(event) => {
        event.preventDefault()
        navigate('/signin')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('userName')

    }

    return(
        <header className="App">
            <a href="/home"><h1>better<b>reads</b></h1></a>
            <div className="nav-buttons">
                <button onClick={() => window.location.href='/profile'}>Profile</button>
                <button onClick={() => navigate('/searchusers')}>Add friend</button>
                <BookSearch />
                <button onClick={signOut}>Sign Out</button>
            </div>
        </header>
    );
}

export default Nav;
