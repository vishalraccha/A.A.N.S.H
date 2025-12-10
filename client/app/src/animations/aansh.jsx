import React, { useState, useEffect, useRef } from 'react';

const aansh = () => {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [eyeAnimation, setEyeAnimation] = useState('normal');
  const [voiceData, setVoiceData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const animationFrameRef = useRef();
  const lastUpdateTime = useRef(0);

  // Enhanced breathing animation when idle (slowed down)
  useEffect(() => {
    const animate = (timestamp) => {
      if (!isListening) {
        const elapsed = timestamp - lastUpdateTime.current;
        if (elapsed > 32) {
          setBreathingPhase(prev => (prev + 0.01) % (Math.PI * 2));
          lastUpdateTime.current = timestamp;
        }
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isListening]);

  // Simulate realistic voice data (slowed down 5x)
  useEffect(() => {
    let interval;
    if (isListening) {
      interval = setInterval(() => {
        const bands = Array.from({ length: 8 }, (_, i) => {
          const baseFreq = Math.random() * 0.8 + 0.2;
          const harmonic = Math.sin(Date.now() / (1000 + i * 250)) * 0.3 + 0.7;
          return Math.min(100, baseFreq * harmonic * 100);
        });
        
        setVoiceData(bands);
        setAudioLevel(bands.reduce((a, b) => a + b) / bands.length);
      }, 250);
    } else {
      setVoiceData([]);
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Enhanced eye blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (!isListening && !isProcessing) {
        const blinkType = Math.random() > 0.7 ? 'double-blink' : 'blink';
        setEyeAnimation(blinkType);
        setTimeout(() => setEyeAnimation('normal'), blinkType === 'double-blink' ? 400 : 150);
      }
    }, 3000 + Math.random() * 4000);

    return () => clearInterval(blinkInterval);
  }, [isListening, isProcessing]);

  const toggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      setIsProcessing(false);
    } else {
      setIsListening(false);
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  // Generate smooth listening ovals
  const generateListeningOvals = () => {
    if (!isListening) return null;
    
    return Array.from({ length: 6 }, (_, i) => {
      const intensity = Math.max(0.3, (audioLevel / 100) * (1 - i * 0.1));
      const baseSize = 100 + i * 30;
      const dynamicScale = 1 + (intensity * 0.4);
      const opacity = intensity * (0.8 - i * 0.1);
      
      return (
        <div
          key={i}
          className="absolute rounded-full transition-all duration-500"
          style={{
            width: `${baseSize}px`,
            height: `${baseSize * 0.6}px`,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${dynamicScale})`,
            background: `linear-gradient(${45 + i * 30}deg, 
              rgba(0,255,255,${opacity * 0.3}), 
              rgba(138,43,226,${opacity * 0.2}), 
              rgba(0,255,255,${opacity * 0.3})
            )`,
            filter: `blur(${2 + i}px)`,
            animation: `listening-oval-${i} ${8 + i * 2}s ease-in-out infinite`,
          }}
        />
      );
    });
  };

  // Generate particle system
  const generateParticles = () => {
    if (!isListening) return null;
    
    return Array.from({ length: 20 }, (_, i) => {
      const intensity = audioLevel / 100;
      const scale = 0.5 + intensity * 1.5;
      const opacity = 0.2 + intensity * 0.6;
      
      return (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            background: `rgba(0, 255, 255, ${opacity})`,
            transform: `scale(${scale})`,
            animation: `particle-float-${i % 4} ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      );
    });
  };

  const breathingScale = 1 + Math.sin(breathingPhase) * 0.02;
  const breathingGlow = 0.3 + Math.sin(breathingPhase * 0.5) * 0.1;

  return (
    <div className="flex items-center justify-center min-h-screen bg-black relative overflow-hidden">
      {/* Enhanced background */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle, rgba(30, 58, 138, 0.3) 0%, rgba(126, 34, 206, 0.15) 40%, transparent 70%)'
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.05), transparent)',
            animation: 'spin 20s linear infinite'
          }}
        />
      </div>
      
      {/* Main container */}
      <div className="relative">
        {/* Dynamic ambient glow */}
        <div 
          className="absolute inset-0 rounded-full transition-all duration-300"
          style={{
            background: isListening 
              ? `radial-gradient(circle, rgba(0,255,255,${0.4 + audioLevel/500}) 0%, rgba(138,43,226,${0.3 + audioLevel/800}) 40%, transparent 70%)`
              : `radial-gradient(circle, rgba(59,130,246,${breathingGlow}) 0%, rgba(147,51,234,${breathingGlow * 0.7}) 40%, transparent 70%)`,
            filter: 'blur(40px)',
            transform: `scale(${isListening ? 1.5 : breathingScale})`,
          }}
        />
        
        {/* Multiple filled rotating ovals - always visible */}
        <div className="absolute inset-0 w-96 h-96">
          {/* Extra outer ovals */}
          <div 
            className="absolute rounded-full opacity-15"
            style={{
              width: '600px',
              height: '300px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: isListening 
                ? 'linear-gradient(60deg, rgba(255,20,147,0.12), rgba(0,255,255,0.08), rgba(255,20,147,0.12))'
                : 'linear-gradient(60deg, rgba(147,51,234,0.08), rgba(59,130,246,0.06), rgba(147,51,234,0.08))',
              animation: 'oval-rotate-1 12s linear infinite',
              filter: 'blur(2px)',
            }}
          />
          
          <div 
            className="absolute rounded-full opacity-18"
            style={{
              width: '560px',
              height: '280px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: isListening 
                ? 'linear-gradient(120deg, rgba(0,255,255,0.15), rgba(138,43,226,0.1), rgba(0,255,255,0.15))'
                : 'linear-gradient(120deg, rgba(59,130,246,0.1), rgba(147,51,234,0.08), rgba(59,130,246,0.1))',
              animation: 'oval-rotate-2 9s linear infinite reverse',
              filter: 'blur(1.5px)',
            }}
          />
          
          <div 
            className="absolute rounded-full opacity-20"
            style={{
              width: '520px',
              height: '260px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: isListening 
                ? 'linear-gradient(45deg, rgba(0,255,255,0.15), rgba(0,128,255,0.1), rgba(0,255,255,0.15))'
                : 'linear-gradient(45deg, rgba(59,130,246,0.1), rgba(37,99,235,0.08), rgba(59,130,246,0.1))',
              animation: 'oval-rotate-3 8s linear infinite',
              filter: 'blur(1px)',
            }}
          />
          
          <div 
            className="absolute rounded-full opacity-25"
            style={{
              width: '450px',
              height: '225px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: isListening 
                ? 'linear-gradient(135deg, rgba(138,43,226,0.2), rgba(168,85,247,0.15), rgba(138,43,226,0.2))'
                : 'linear-gradient(135deg, rgba(147,51,234,0.12), rgba(139,92,246,0.1), rgba(147,51,234,0.12))',
              animation: 'oval-rotate-4 6s linear infinite reverse',
              filter: 'blur(0.5px)',
            }}
          />
          
          <div 
            className="absolute rounded-full opacity-30"
            style={{
              width: '380px',
              height: '190px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: isListening 
                ? 'linear-gradient(90deg, rgba(0,128,255,0.25), rgba(0,255,255,0.2), rgba(0,128,255,0.25))'
                : 'linear-gradient(90deg, rgba(37,99,235,0.15), rgba(59,130,246,0.12), rgba(37,99,235,0.15))',
              animation: 'oval-rotate-5 10s linear infinite',
            }}
          />
          
          <div 
            className="absolute rounded-full opacity-35"
            style={{
              width: '320px',
              height: '160px',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              background: isListening 
                ? 'linear-gradient(225deg, rgba(0,255,255,0.3), rgba(255,255,255,0.15), rgba(0,255,255,0.3))'
                : 'linear-gradient(225deg, rgba(59,130,246,0.18), rgba(255,255,255,0.08), rgba(59,130,246,0.18))',
              animation: 'oval-rotate-6 4s linear infinite reverse',
            }}
          />
        </div>
        
        {/* Voice wave container */}
        <div className="relative w-96 h-96 flex items-center justify-center">
          {generateListeningOvals()}
          {generateParticles()}
          
          {/* Main AI orb - blurry with rotating effect */}
          <div 
            className="relative w-72 h-72 rounded-full cursor-pointer transition-all duration-500"
            onClick={toggleListening}
            style={{
              background: isListening 
                ? 'radial-gradient(circle at 30% 30%, rgba(0,255,255,0.4), rgba(0,128,255,0.3), rgba(138,43,226,0.2), rgba(0,255,255,0.3))'
                : 'radial-gradient(circle at 30% 30%, rgba(59,130,246,0.3), rgba(37,99,235,0.4), rgba(29,78,216,0.3))',
              boxShadow: isListening 
                ? '0 0 80px rgba(0,255,255,0.8), 0 0 120px rgba(138,43,226,0.4), inset 0 0 40px rgba(255,255,255,0.1)'
                : `0 0 60px rgba(59,130,246,${breathingGlow}), inset 0 0 30px rgba(255,255,255,0.05)`,
              transform: `scale(${breathingScale})`,
              filter: 'blur(8px)',
              animation: isListening ? 'main-orb-rotate 15s linear infinite' : 'none',
            }}
          >
            {/* Inner core */}
            <div 
              className="absolute inset-6 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                background: 'radial-gradient(circle at 40% 40%, rgba(15,23,42,0.6), rgba(30,41,59,0.7), rgba(15,23,42,0.8))',
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), inset 0 0 20px rgba(59,130,246,0.2)',
                filter: 'blur(3px)',
                animation: isListening ? 'inner-core-rotate 20s linear infinite reverse' : 'none',
              }}
            >
              {/* Eyes */}
              <div className="flex space-x-10 relative">
                <div className="relative">
                  <div 
                    className={`w-7 h-14 rounded-full transition-all duration-200 ${isListening ? 'animate-pulse' : ''}`}
                    style={{
                      background: isListening 
                        ? 'linear-gradient(to bottom, rgba(0,255,255,1), rgba(255,255,255,0.9), rgba(0,255,255,1))'
                        : 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(240,248,255,0.8), rgba(255,255,255,0.95))',
                      boxShadow: isListening 
                        ? '0 0 25px rgba(0,255,255,0.9), inset 0 0 10px rgba(0,255,255,0.3)' 
                        : '0 0 15px rgba(255,255,255,0.4), inset 0 0 8px rgba(59,130,246,0.2)',
                      transform: eyeAnimation === 'blink' ? 'scaleY(0.1)' : eyeAnimation === 'double-blink' ? 'scaleY(0.1)' : 'scaleY(1)',
                    }}
                  />
                  <div 
                    className="absolute top-3 left-1.5 w-2.5 h-4 rounded-full transition-all duration-200"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(200,230,255,0.6))',
                      opacity: eyeAnimation === 'blink' ? 0 : 0.8,
                    }}
                  />
                </div>
                
                <div className="relative">
                  <div 
                    className={`w-7 h-14 rounded-full transition-all duration-200 ${isListening ? 'animate-pulse' : ''}`}
                    style={{
                      background: isListening 
                        ? 'linear-gradient(to bottom, rgba(0,255,255,1), rgba(255,255,255,0.9), rgba(0,255,255,1))'
                        : 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(240,248,255,0.8), rgba(255,255,255,0.95))',
                      boxShadow: isListening 
                        ? '0 0 25px rgba(0,255,255,0.9), inset 0 0 10px rgba(0,255,255,0.3)' 
                        : '0 0 15px rgba(255,255,255,0.4), inset 0 0 8px rgba(59,130,246,0.2)',
                      transform: eyeAnimation === 'blink' ? 'scaleY(0.1)' : eyeAnimation === 'double-blink' ? 'scaleY(0.1)' : 'scaleY(1)',
                    }}
                  />
                  <div 
                    className="absolute top-3 left-1.5 w-2.5 h-4 rounded-full transition-all duration-200"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.9), rgba(200,230,255,0.6))',
                      opacity: eyeAnimation === 'blink' ? 0 : 0.8,
                    }}
                  />
                </div>
              </div>
              
              {/* Voice bars */}
              {isListening && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {voiceData.slice(0, 8).map((intensity, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: '3px',
                        height: `${6 + (intensity / 100) * 25}px`,
                        background: `linear-gradient(to top, rgba(0,255,255,${0.8 + intensity/500}), rgba(138,43,226,${0.6 + intensity/400}))`,
                        boxShadow: `0 0 ${intensity/10}px rgba(0,255,255,0.6)`,
                        transform: `scaleY(${0.3 + (intensity / 100) * 1.2})`,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-orange-400"
                        style={{
                          animation: 'processing-bounce 1.4s ease-in-out infinite',
                          animationDelay: `${i * 0.16}s`,
                          boxShadow: '0 0 10px rgba(251,146,60,0.8)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Status display */}
        <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 text-center">
          <div 
            className={`text-lg font-medium transition-all duration-500 ${
              isProcessing ? 'text-orange-400' : isListening ? 'text-cyan-400' : 'text-blue-400'
            }`}
            style={{
              textShadow: isListening ? '0 0 20px rgba(0,255,255,0.8)' : isProcessing ? '0 0 20px rgba(251,146,60,0.8)' : '0 0 10px rgba(59,130,246,0.5)',
            }}
          >
            {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Ready to assist'}
          </div>
          
          <div className="flex justify-center mt-3 space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                style={{
                  background: isProcessing 
                    ? 'rgba(251,146,60,0.8)'
                    : isListening 
                      ? 'rgba(0,255,255,0.8)' 
                      : 'rgba(59,130,246,0.4)',
                  transform: isListening ? `scale(${1 + (voiceData[i] || 0)/200})` : 'scale(1)',
                  animation: isProcessing ? `processing-bounce 1.4s ease-in-out infinite` : 
                            isListening ? `listening-pulse 2s ease-in-out infinite` : 'none',
                  animationDelay: `${i * 0.1}s`,
                  boxShadow: isListening ? '0 0 10px rgba(0,255,255,0.6)' : isProcessing ? '0 0 10px rgba(251,146,60,0.6)' : 'none',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: isListening 
                ? `rgba(0,255,255,${0.1 + Math.random() * 0.3})`
                : `rgba(59,130,246,${0.05 + Math.random() * 0.15})`,
              animation: `float-${i % 4} ${8 + Math.random() * 12}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes processing-bounce {
          0%, 80%, 100% { transform: scale(1); opacity: 0.6; }
          40% { transform: scale(1.3); opacity: 1; }
        }
        
        @keyframes listening-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        
        @keyframes main-orb-rotate {
          from { transform: scale(1) rotate(0deg); }
          to { transform: scale(1) rotate(360deg); }
        }
        
        @keyframes inner-core-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes oval-rotate-1 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes oval-rotate-2 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes oval-rotate-3 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes oval-rotate-4 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes oval-rotate-5 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes oval-rotate-6 {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes listening-oval-0 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
        }
        
        @keyframes listening-oval-1 {
          0%, 100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.7; }
        }
        
        @keyframes listening-oval-2 {
          0%, 100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.6; }
        }
        
        @keyframes listening-oval-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.5; }
        }
        
        @keyframes listening-oval-4 {
          0%, 100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.2; }
          50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.4; }
        }
        
        @keyframes listening-oval-5 {
          0%, 100% { transform: translate(-50%, -50%) scale(0.7); opacity: 0.1; }
          50% { transform: translate(-50%, -50%) scale(1.0); opacity: 0.3; }
        }
        
        @keyframes particle-float-0 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(15px) rotate(90deg); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-10px) rotate(180deg); opacity: 0.6; }
          75% { transform: translateY(15px) translateX(20px) rotate(270deg); opacity: 0.9; }
        }
        
        @keyframes particle-float-1 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.4; }
          33% { transform: translateY(25px) translateX(-15px) rotate(120deg); opacity: 0.7; }
          66% { transform: translateY(-15px) translateX(25px) rotate(240deg); opacity: 0.9; }
        }
        
        @keyframes particle-float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.2; }
          50% { transform: translateY(-30px) translateX(0px) rotate(180deg); opacity: 0.8; }
        }
        
        @keyframes particle-float-3 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); opacity: 0.3; }
          25% { transform: translateY(20px) translateX(30px) rotate(90deg) scale(1.2); opacity: 0.6; }
          50% { transform: translateY(-25px) translateX(-20px) rotate(180deg) scale(0.8); opacity: 0.9; }
          75% { transform: translateY(10px) translateX(-30px) rotate(270deg) scale(1.1); opacity: 0.4; }
        }
        
        @keyframes float-0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.2; }
          33% { transform: translateY(-25px) rotate(120deg); opacity: 0.6; }
          66% { transform: translateY(15px) rotate(240deg); opacity: 0.8; }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translateX(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateX(40px) rotate(180deg); opacity: 0.7; }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg) scale(1); opacity: 0.1; }
          25% { transform: translateY(-30px) translateX(20px) rotate(90deg) scale(1.3); opacity: 0.4; }
          50% { transform: translateY(20px) translateX(-30px) rotate(180deg) scale(0.7); opacity: 0.6; }
          75% { transform: translateY(35px) translateX(25px) rotate(270deg) scale(1.1); opacity: 0.3; }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.25; }
          50% { transform: translateY(-40px) scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default aansh;