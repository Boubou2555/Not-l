import React, { useEffect, useState } from 'react';
import './index.css';
import Arrow from './icons/Arrow';
import { bear, coin, highVoltage, notcoin, rocket, trophy } from './images';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [points, setPoints] = useState<number>(0);
  const [energy, setEnergy] = useState<number>(0);
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number }[]>([]);
  const pointsToAdd = 12;
  const energyToReduce = 12;

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prevEnergy) => Math.min(prevEnergy + 1, 6500));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = async (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (energy - energyToReduce < 0) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = points + pointsToAdd;
    const newEnergy = energy - energyToReduce < 0 ? 0 : energy - energyToReduce;

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        points: newPoints,
        energy: newEnergy,
      });
    }

    setPoints(newPoints);
    setEnergy(newEnergy);
    setClicks([...clicks, { id: Date.now(), x, y }]);
  };

  const handleAnimationEnd = (id: number) => {
    setClicks((prevClicks) => prevClicks.filter(click => click.id !== id));
  };

  const handleSignUp = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        points: 0,
        energy: 2532,
      });

      console.log('User signed up and data stored in Firestore:', user);
      setUser(user);
      setPoints(0);
      setEnergy(2532);
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUser(user);

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setPoints(userData?.points || 0);
        setEnergy(userData?.energy || 2532);
      } else {
        console.log('No such document!');
      }
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div className="bg-gradient-main min-h-screen px-4 flex flex-col items-center text-white font-roboto">
      <div className="absolute inset-0 h-1/2 bg-gradient-overlay z-0"></div>
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <div className="radial-gradient-overlay"></div>
      </div>

      <div className="w-full z-10 min-h-screen flex flex-col items-center text-white">

        {!user && (
          <div className="fixed top-0 left-0 w-full px-4 pt-8 z-10 flex flex-col items-center text-white">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-2 p-2 rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-2 p-2 rounded"
            />
            <button onClick={handleSignUp} className="mb-2 p-2 bg-blue-500 rounded">Sign Up</button>
            <button onClick={handleSignIn} className="p-2 bg-green-500 rounded">Sign In</button>
          </div>
        )}

        {user && (
          <>
            <div className="fixed top-0 left-0 w-full px-4 pt-8 z-10 flex flex-col items-center text-white">
              <div className="w-full cursor-pointer">
                <div className="bg-[#1f1f1f] text-center py-2 rounded-lg shadow-md">
                  <h1 className="text-4xl font-bold">Notcoin</h1>
                </div>
              </div>
              <div className="w-full bg-[#9899a6] rounded-full mt-4">
                <div className="bg-gradient-to-r from-[#606687] to-[#fffad0] h-4 rounded-full" style={{ width: `${(energy / 6500) * 100}%` }}></div>
              </div>
            </div>

            <div className="flex-grow flex items-center justify-center">
              <div className="relative mt-4" onClick={handleClick}>
                <img src={notcoin} width={256} height={256} alt="notcoin" />
                {clicks.map((click) => (
                  <div
                    key={click.id}
                    className="absolute text-5xl font-bold opacity-0 text-yellow-500"
                    style={{
                      top: `${click.y - 42}px`,
                      left: `${click.x - 28}px`,
                      animation: `float 1s ease-out`
                    }}
                    onAnimationEnd={() => handleAnimationEnd(click.id)}
                  >
                    +12
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
