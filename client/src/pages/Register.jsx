import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function App() {
  
  const navigate = useNavigate();
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function registerUser(event){
    event.preventDefault()
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password
      }),
    })

    const data = await response.json()
    if(data.status === 'ok'){
      navigate('/login');
    }
  }

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={registerUser}>
        <input type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <input type="submit" value="Register" />
      </form>
    </div>
  )
}

export default App
