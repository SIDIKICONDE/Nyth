import React, { useState, useEffect } from 'react';

const test = () => {
  const [state, setState] = useState(0);
  useEffect(() => {
    console.log('test');
  }, []);
};
