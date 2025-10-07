import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo2 from '../../assets/logo2.png';

const Lightning = ({
  hue = 230,
  xOffset = 0,
  speed = 1,
  intensity = 1,
  size = 1,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      
      #define OCTAVE_COUNT 10

      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash11(float p) {
          p = fract(p * .1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
      }

      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));
          
          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          float aspect = iResolution.x / iResolution.y;
          if (aspect > 1.0) {
              uv.x *= aspect;
          } else {
              uv.y /= aspect;
          }
          uv.x += uXOffset;
          
          uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;
          
          float dist = abs(uv.x);
          vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
          vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
          col = pow(col, vec3(1.0));
          fragColor = vec4(col, 1.0);
      }

      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

    const compileShader = (source, type) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program linking error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const vertices = new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
    const iTimeLocation = gl.getUniformLocation(program, "iTime");
    const uHueLocation = gl.getUniformLocation(program, "uHue");
    const uXOffsetLocation = gl.getUniformLocation(program, "uXOffset");
    const uSpeedLocation = gl.getUniformLocation(program, "uSpeed");
    const uIntensityLocation = gl.getUniformLocation(program, "uIntensity");
    const uSizeLocation = gl.getUniformLocation(program, "uSize");

    // Validate all uniform locations before rendering
    const uniformLocations = {
      iResolution: iResolutionLocation,
      iTime: iTimeLocation,
      uHue: uHueLocation,
      uXOffset: uXOffsetLocation,
      uSpeed: uSpeedLocation,
      uIntensity: uIntensityLocation,
      uSize: uSizeLocation
    };

    // Check if any uniform location is invalid
    const hasInvalidUniforms = Object.values(uniformLocations).some(loc => loc === null || loc === -1);
    if (hasInvalidUniforms) {
      console.warn("Some uniform locations are invalid, skipping WebGL rendering");
      return;
    }

    let animationId;
    const startTime = performance.now();
    
    const render = () => {
      try {
        // Validate WebGL context is still valid
        if (gl.isContextLost()) {
          console.warn("WebGL context lost, stopping animation");
          return;
        }

        resizeCanvas();
        gl.viewport(0, 0, canvas.width, canvas.height);
        
        // Only set uniforms if locations are valid
        if (iResolutionLocation !== null && iResolutionLocation !== -1) {
          gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
        }
        
        const currentTime = performance.now();
        if (iTimeLocation !== null && iTimeLocation !== -1) {
          gl.uniform1f(iTimeLocation, (currentTime - startTime) / 1000.0);
        }
        if (uHueLocation !== null && uHueLocation !== -1) {
          gl.uniform1f(uHueLocation, hue);
        }
        if (uXOffsetLocation !== null && uXOffsetLocation !== -1) {
          gl.uniform1f(uXOffsetLocation, xOffset);
        }
        if (uSpeedLocation !== null && uSpeedLocation !== -1) {
          gl.uniform1f(uSpeedLocation, speed);
        }
        if (uIntensityLocation !== null && uIntensityLocation !== -1) {
          gl.uniform1f(uIntensityLocation, intensity);
        }
        if (uSizeLocation !== null && uSizeLocation !== -1) {
          gl.uniform1f(uSizeLocation, size);
        }
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationId = requestAnimationFrame(render);
      } catch (error) {
        console.error("WebGL render error:", error);
        // Stop the animation loop on error
      }
    };
    
    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [hue, xOffset, speed, intensity, size]);

  return <canvas ref={canvasRef} className="w-full h-full relative" />;
};

export const HeroSection = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  // Track screen size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const lightningHue = 212;
  const isMobile = screenSize.width < 768;
  const isSmall = screenSize.width < 640;

  // Logo size function - only this is needed now
  const getLogoSize = () => {
      return 'w-90 h-90';
  };

  // Lightning parameters adjusted for mobile
  const getLightningProps = () => {
    if (isSmall) {
      return {
        hue: lightningHue,
        xOffset: 1.0,
        speed: 1.6,
        intensity: 0.6,
        size: 1.7
      };
    } else if (isMobile) {
      return {
        hue: lightningHue,
        xOffset: 0,
        speed: 1.6,
        intensity: 0.6,
        size: 2
      };
    } else {
      return {
        hue: lightningHue,
        xOffset: 0,
        speed: 1.6,
        intensity: 0.6,
        size: 2
      };
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const lightningProps = getLightningProps();

  return (
    <div className="relative w-full h-screen bg-white dark:bg-black text-gray-900 dark:text-white overflow-hidden">
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-6 h-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-30 flex flex-col items-center text-center w-full mx-auto mt-20"
        >
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-7xl font-light mb-2 text-gray-900 dark:text-white"
          >
            Scatch
          </motion.h1>

          <motion.h2
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl pb-3 font-light bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300 bg-clip-text text-transparent"
          >
            Premium Shopping Experience
          </motion.h2>

          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/shop'}
            className="mt-8 px-6 sm:px-8 py-3 bg-gray-800/10 dark:bg-white/10 backdrop-blur-sm rounded-full hover:bg-gray-800/20 dark:hover:bg-white/20 transition-colors cursor-pointer text-sm sm:text-base text-gray-900 dark:text-white"
          >
            Start Shopping
          </motion.button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 z-0"
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80"></div>
        
        {/* Gradient blur background */}
        <div className={`absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isSmall ? 'w-[250px] h-[250px]' : isMobile ? 'w-[400px] h-[400px]' : 'w-[800px] h-[800px]'} rounded-full bg-gradient-to-b from-blue-500/20 to-purple-600/10 blur-3xl`}></div>
        
        {/* Lightning effect */}
        <div className="absolute top-0 w-full left-1/2 transform -translate-x-1/2 h-full">
          <Lightning {...lightningProps} />
        </div>
        
        {/* Logo circle - using original positioning exactly as provided */}
        <div className="z-10 absolute top-[50.5%] sm:top-[50.7%] md:top-[61.6%] lg:top-[58.9%] xl:top-[50.4%] 2xl:top-[50.3%] left-1/2 transform -translate-x-1/2 w-[550px] h-[550px] backdrop-blur-3xl rounded-full flex items-center justify-center">
          <img 
            src={logo2} 
            alt="Scatch" 
            className={`${getLogoSize()} opacity-80 rounded-full`} 
            onError={(e) => e.target.style.display = 'none'} 
          />
        </div>
      </motion.div>
    </div>
  );
};