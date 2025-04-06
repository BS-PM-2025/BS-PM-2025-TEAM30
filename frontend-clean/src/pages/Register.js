import React, { useRef } from 'react';

const Register = () => {
  const inputRef = useRef(null);

  return (
    <div>
      <h2>רישום משתמש</h2>
      <input ref={inputRef} placeholder="שם משתמש" />
    </div>
  );
};

export default Register;
