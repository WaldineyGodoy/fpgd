
import React from 'react';
import RegistrationForm from './components/RegistrationForm';

function App() {
  return (
    // changed min-h-screen to pure flex centering but allowing scroll
    <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <RegistrationForm />
    </div>
  );
}

export default App;
