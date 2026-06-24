import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { tapBuzz } from './lib/haptics.js'

// gentle tactile feedback on every button press
document.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) tapBuzz()
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
