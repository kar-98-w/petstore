import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import './App.css';

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  image: string | null;
  description: string | null;
  price: number | null;
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <h1>Marron's Pet Store</h1>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/add">Add Pet</Link>
          <Link to="/search">Search Pets</Link>
        </nav>
        <Routes>
          <Route path="/" element={<PetList />} />
          <Route path="/add" element={<AddPet />} />
          <Route path="/search" element={<SearchPets />} />
          <Route path="/pets/:id" element={<PetDetails />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

// Pet List Component
function PetList() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/marron/pets')
      .then(response => response.ok ? (response.json() as Promise<Pet[]>) : Promise.reject(new Error(`HTTP error! status: ${response.status}`)))
      .then(data => { setPets(data); setLoading(false); })
      .catch((err: Error) => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Loading pets...</div>;
  if (error) return <div className="error">Error loading pets: {error}</div>;

  return (
    <div className="pet-list-container">
      <h2>Available Pets</h2>
      <div className="pet-grid">
        {pets.map(pet => (
          <div key={pet.id} className="pet-card">
            {pet.image && <img src={pet.image} alt={pet.name} className="pet-image" />}
            <div className="pet-details">
              <h3>{pet.name}</h3>
              <p><strong>Species:</strong> {pet.species}</p>
              <p><strong>Breed:</strong> {pet.breed}</p>
              <p><strong>Gender:</strong> {pet.gender}</p>
              <p className="pet-price">Price: ${pet.price !== null && pet.price !== undefined ? pet.price.toFixed(2) : 'N/A'}</p>
              <Link to={`/pets/${pet.id}`} className="view-details-button">View Details</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Add Pet Component
interface AddPetForm {
  name: string;
  species: string;
  breed: string;
  gender: string;
  image: string;
  description: string;
  price: string;
}

function AddPet() {
  const [newPet, setNewPet] = useState<AddPetForm>({ name: '', species: '', breed: '', gender: '', image: '', description: '', price: '' });
  const [message, setMessage] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPet(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/marron/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPet, price: parseFloat(newPet.price) }),
      });
      if (response.ok) { setMessage('Pet added successfully!'); setNewPet({ name: '', species: '', breed: '', gender: '', image: '', description: '', price: '' }); }
      else { const errData = await response.json(); setMessage(`Error: ${errData?.message || response.statusText}`); }
    } catch (err: any) { setMessage(`Error: ${err.message}`); }
  };

  return (
    <div className="add-pet-container">
      <h2>Add a New Pet</h2>
      {message && <p className={message.startsWith('Error') ? 'error-message' : 'success-message'}>{message}</p>}
      <form onSubmit={handleSubmit} className="add-pet-form">
        <label htmlFor="name">Name:</label><input type="text" id="name" name="name" value={newPet.name} onChange={handleChange} required />
        <label htmlFor="species">Species:</label><input type="text" id="species" name="species" value={newPet.species} onChange={handleChange} required />
        <label htmlFor="breed">Breed:</label><input type="text" id="breed" name="breed" value={newPet.breed} onChange={handleChange} />
        <label htmlFor="gender">Gender:</label><input type="text" id="gender" name="gender" value={newPet.gender} onChange={handleChange} />
        <label htmlFor="image">Image URL:</label><input type="text" id="image" name="image" value={newPet.image} onChange={handleChange} />
        <label htmlFor="description">Description:</label><textarea id="description" name="description" value={newPet.description} onChange={handleChange} />
        <label htmlFor="price">Price:</label><input type="number" id="price" name="price" value={newPet.price} onChange={handleChange} required />
        <button type="submit">Add Pet</button>
      </form>
    </div>
  );
}

// Search Pets Component
interface SearchParams {
  name: string;
  species: string;
  breed: string;
  gender: string;
  image: string;
  description: string;
  price: string;
}

function SearchPets() {
  const [searchParams, setSearchParams] = useState<SearchParams>({ name: '', species: '', breed: '', gender: '', image: '', description: '', price: '' });
  const [searchResults, setSearchResults] = useState<Pet[]>([]);
  const [searchMessage, setSearchMessage] = useState<string>('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams(Object.fromEntries(Object.entries(searchParams).filter(([_, v]) => v)));
    try {
      const response = await fetch(`http://localhost:8080/marron/pets/search?${query}`);
      if (response.ok) { const data = await (response.json() as Promise<Pet[]>); setSearchResults(data); setSearchMessage(data.length ? '' : 'No matching pets found.'); }
      else { const errData = await response.json(); setSearchMessage(`Error: ${errData?.message || response.statusText}`); setSearchResults([]); }
    } catch (err: any) { setSearchMessage(`Error: ${err.message}`); setSearchResults([]); }
  };

  const handleSearchByPrice = async (e: FormEvent) => {
    e.preventDefault();
    if (searchParams.price) {
      try {
        const response = await fetch(`http://localhost:8080/marron/pets/search/price/${searchParams.price}`);
        if (response.ok) { const data = await (response.json() as Promise<Pet[]>); setSearchResults(data); setSearchMessage(data.length ? '' : `No pets found with price <= $${searchParams.price}.`); }
        else { const errData = await response.json(); setSearchMessage(`Error: ${errData?.message || response.statusText}`); setSearchResults([]); }
      } catch (err: any) { setSearchMessage(`Error: ${err.message}`); setSearchResults([]); }
    } else { setSearchMessage('Please enter a price to search.'); setSearchResults([]); }
  };

  return (
    <div className="search-pets-container">
      <h2>Search Pets</h2>
      <form onSubmit={handleSearch} className="search-form">
        <label htmlFor="name">Name:</label><input type="text" id="name" name="name" value={searchParams.name} onChange={handleChange} />
        <label htmlFor="species">Species:</label><input type="text" id="species" name="species" value={searchParams.species} onChange={handleChange} />
        <label htmlFor="breed">Breed:</label><input type="text" id="breed" name="breed" value={searchParams.breed} onChange={handleChange} />
        <label htmlFor="gender">Gender:</label><input type="text" id="gender" name="gender" value={searchParams.gender} onChange={handleChange} />
        <label htmlFor="image">Image URL:</label><input type="text" id="image" name="image" value={searchParams.image} onChange={handleChange} />
        <label htmlFor="description">Description:</label><input type="text" id="description" name="description" value={searchParams.description} onChange={handleChange} />
        <button type="submit">Search</button>
      </form>
      <div className="search-by-price">
        <h3>Search by Price (Max)</h3>
        <form onSubmit={handleSearchByPrice}>
          <label htmlFor="price">Max Price:</label><input type="number" id="price" name="price" value={searchParams.price} onChange={handleChange} />
          <button type="submit">Search by Price</button>
        </form>
      </div>
      {searchMessage && <p className={searchMessage.startsWith('Error') ? 'error-message' : 'info-message'}>{searchMessage}</p>}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          <div className="pet-grid">
            {searchResults.map(pet => (
              <div key={pet.id} className="pet-card">
                {pet.image && <img src={pet.image} alt={pet.name} className="pet-image" />}
                <div className="pet-details">
                  <h3>{pet.name}</h3>
                  <p><strong>Species:</strong> {pet.species}</p>
                  <p><strong>Breed:</strong> {pet.breed}</p>
                  <p><strong>Gender:</strong> {pet.gender}</p>
                  <p className="pet-price">Price: ${pet.price !== null && pet.price !== undefined ? pet.price.toFixed(2) : 'N/A'}</p>
                  <Link to={`/pets/${pet.id}`} className="view-details-button">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Pet Details Component
interface RouteParams {
  id: string;
}

interface EditPetForm {
  name: string;
  species: string;
  breed: string | null;
  gender: string | null;
  image: string | null;
  description: string | null;
  price: string | null;
}

function PetDetails() {
  const { id } = useParams<RouteParams>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedPet, setEditedPet] = useState<EditPetForm>({ name: '', species: '', breed: '', gender: '', image: '', description: '', price: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetch(`http://localhost:8080/marron/pets/${id}`)
        .then(res => res.ok ? (res.json() as Promise<Pet>) : Promise.reject(new Error(`HTTP error! status: ${res.status}`)))
        .then(data => { setPet(data); setEditedPet(data); setLoading(false); })
        .catch((err: Error) => { setError(err.message); setLoading(false); });
    }
  }, [id]);

  useEffect(() => {
    if (pet) {
      setEditedPet({
        name: pet.name,
        species: pet.species,
        breed: pet.breed || '',
        gender: pet.gender || '',
        image: pet.image || '',
        description: pet.description || '',
        price: pet.price?.toString() || '',
      });
    }
  }, [pet]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedPet(prev => ({ ...prev, [name]: value }));
  };
  const handleEdit = () => setIsEditing(true);
  const handleCancelEdit = () => { setIsEditing(false); setEditedPet(pet ? {
    name: pet.name,
    species: pet.species,
    breed: pet.breed || '',
    gender: pet.gender || '',
    image: pet.image || '',
    description: pet.description || '',
    price: pet.price?.toString() || '',
  } : { name: '', species: '', breed: '', gender: '', image: '', description: '', price: '' }); setError(null); };

  const handleSave = async () => {
    if (!id) return;
    try {
      const response = await fetch(`http://localhost:8080/marron/pets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editedPet, price: parseFloat(editedPet.price || '0') }),
      });
      if (response.ok) { const updatedPet = await (response.json() as Promise<Pet>); setPet(updatedPet); setEditedPet(updatedPet); setIsEditing(false); setError(null); }
      else { const errData = await response.json(); setError(`Error updating: ${errData?.message || response.statusText}`); }
    } catch (err: any) { setError(`Error updating: ${err.message}`); }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (window.confirm('Are you sure?')) {
      try {
        const response = await fetch(`http://localhost:8080/marron/pets/${id}`, { method: 'DELETE' });
        if (response.ok) navigate('/');
        else { const errData = await response.json(); setError(`Error deleting: ${errData?.message || response.statusText}`); }
      } catch (err: any) { setError(`Error deleting: ${err.message}`); }
    }
  };

  if (loading) return <div className="loading">Loading pet details...</div>;
  if (error) return <div className="error">Error loading details: {error}</div>;
  if (!pet) return <div>Pet not found</div>;

  return (
    <div className="pet-details-container">
      <h2>Pet Details</h2>
      {isEditing ? (
        <div className="edit-form">
          <label htmlFor="name">Name:</label><input type="text" name="name" value={editedPet.name || ''} onChange={handleChange} />
          <label htmlFor="species">Species:</label><input type="text" name="species" value={editedPet.species || ''} onChange={handleChange} />
          <label htmlFor="breed">Breed:</label><input type="text" name="breed" value={editedPet.breed || ''} onChange={handleChange} />
          <label htmlFor="gender">Gender:</label><input type="text" name="gender" value={editedPet.gender || ''} onChange={handleChange} />
          <label htmlFor="image">Image URL:</label><input type="text" name="image" value={editedPet.image || ''} onChange={handleChange} />
          <label htmlFor="description">Description:</label><textarea name="description" value={editedPet.description || ''} onChange={handleChange} />
          <label htmlFor="price">Price:</label><input type="number" name="price" value={editedPet.price || ''} onChange={handleChange} />
          <div className="edit-actions">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancelEdit}>Cancel</button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="pet-info">
          {pet.image && <img src={pet.image} alt={pet.name} className="pet-image-details" />}
          <h3>{pet.name}</h3>
          <p><strong>Species:</strong> {pet.species}</p>
          <p><strong>Breed:</strong> {pet.breed}</p>
          <p><strong>Gender:</strong> {pet.gender}</p>
          <p><strong>Description:</strong> {pet.description}</p>
          <p><strong>Price:</strong> ${pet.price !== null && pet.price !== undefined ? parseFloat(pet.price.toString()).toFixed(2) : 'N/A'}</p>
          <div className="details-actions">
            <button onClick={handleEdit}>Edit</button>
            <button onClick={handleDelete} className="delete-button">Delete</button>
            <button onClick={() => navigate('/')}>Back to List</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;