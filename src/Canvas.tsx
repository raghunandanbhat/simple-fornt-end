import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

type ShaderData = {
  vertex_shader: string;
  fragment_shader: string;
  vertex_data: {
    positions: number[];
    indices?: number[]; // Make indices optional
    dimensionality: number; // 2 for 2D, 3 for 3D
  };
  uniforms: {
    u_resolution: [number, number];
    u_time: number;
    u_color: [number, number, number, number];
  };
  attributes: {
    a_position: number[];
  };
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  scene: {
    background_color: [number, number, number, number];
  };
  mesh: {
    scale: [number, number, number];
  };
};

export default function ShaderDisplay() {
  const [description, setDescription] = useState<string>("");
  const [shaderData, setShaderData] = useState<ShaderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const fetchShaderCode = async () => {
    if (!description.trim()) {
      setError("Please enter a shader description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://thebackend.fly.dev/api/process_prompt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: description }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Server responded with ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setShaderData(data.response);
    } catch (error) {
      console.error("Error fetching shader code:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch shader code",
      );
    } finally {
      setLoading(false);
    }
  };

  // Cleanup function to handle renderer and animation frame
  const cleanup = () => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (rendererRef.current && canvasRef.current) {
      try {
        // Remove the renderer's DOM element from the container
        const rendererDomElement = rendererRef.current.domElement;
        if (rendererDomElement.parentElement) {
          rendererDomElement.parentElement.removeChild(rendererDomElement);
        }

        // Dispose of the renderer
        rendererRef.current.dispose();
        rendererRef.current = null;
      } catch (e) {
        console.error("Error during cleanup:", e);
      }
    }
  };

  useEffect(() => {
    // Clean up the previous renderer if it exists
    cleanup();

    if (!shaderData || !canvasRef.current) return;

    try {
      // Create scene
      const scene = new THREE.Scene();
      const [r, g, b, a] = shaderData.scene.background_color;
      scene.background = new THREE.Color(r, g, b);

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.set(
        shaderData.camera.position[0],
        shaderData.camera.position[1],
        shaderData.camera.position[2],
      );
      camera.lookAt(
        shaderData.camera.target[0],
        shaderData.camera.target[1],
        shaderData.camera.target[2],
      );

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(500, 500);
      renderer.setPixelRatio(window.devicePixelRatio);
      canvasRef.current.innerHTML = ""; // Clear previous content
      canvasRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Create geometry
      const geometry = new THREE.BufferGeometry();

      // Handle positions based on dimensionality
      const dimensionality = shaderData.vertex_data.dimensionality;
      const positions = shaderData.vertex_data.positions;

      if (dimensionality === 2) {
        // Convert 2D positions to 3D for Three.js
        const vertices = [];
        for (let i = 0; i < positions.length; i += 2) {
          vertices.push(positions[i], positions[i + 1], 0);
        }
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(vertices, 3),
        );
      } else {
        // Use positions as is for 3D
        geometry.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(positions, dimensionality),
        );
      }

      // Set indices if they exist
      if (
        shaderData.vertex_data.indices &&
        shaderData.vertex_data.indices.length > 0
      ) {
        geometry.setIndex(
          new THREE.BufferAttribute(
            new Uint16Array(shaderData.vertex_data.indices),
            1,
          ),
        );
      }

      geometry.computeBoundingSphere();

      // Create uniforms
      const uniforms = {
        u_resolution: {
          value: new THREE.Vector2(
            shaderData.uniforms.u_resolution[0],
            shaderData.uniforms.u_resolution[1],
          ),
        },
        u_time: { value: 0.0 },
        u_color: {
          value: new THREE.Vector4(
            shaderData.uniforms.u_color[0],
            shaderData.uniforms.u_color[1],
            shaderData.uniforms.u_color[2],
            shaderData.uniforms.u_color[3],
          ),
        },
      };

      // Create shader material
      const material = new THREE.ShaderMaterial({
        vertexShader: shaderData.vertex_shader,
        fragmentShader: shaderData.fragment_shader,
        uniforms: uniforms,
        transparent: true,
      });

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(
        shaderData.mesh.scale[0],
        shaderData.mesh.scale[1],
        shaderData.mesh.scale[2],
      );
      scene.add(mesh);

      // Animation loop
      const startTime = Date.now();
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);

        // Update time uniform
        const elapsedTime = (Date.now() - startTime) / 1000;
        material.uniforms.u_time.value = elapsedTime;

        renderer.render(scene, camera);
      };

      animate();

      setError(null);
    } catch (err) {
      console.error("Error setting up Three.js:", err);
      setError(
        `Error rendering shader: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Cleanup on unmount or when shaderData changes
    return cleanup;
  }, [shaderData]);

  // Cleanup on component unmount
  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        padding: "20px",
      }}
    >
      <h1 style={{ fontSize: "24px", marginBottom: "10px" }}>
        WebGL Shader Generator
      </h1>

      <div
        style={{
          display: "flex",
          gap: "10px",
          width: "100%",
          maxWidth: "500px",
        }}
      >
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your shader (e.g., rotating cube, gradient background)"
          style={{
            flex: 1,
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={fetchShaderCode}
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "10px",
            border: "1px solid #f44336",
            borderRadius: "4px",
            backgroundColor: "#ffebee",
            color: "#b71c1c",
            width: "100%",
            maxWidth: "500px",
          }}
        >
          {error}
        </div>
      )}

      <div
        ref={canvasRef}
        style={{
          width: "500px",
          height: "500px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          backgroundColor: "#f0f0f0",
          overflow: "hidden",
        }}
      ></div>

      {shaderData && (
        <div
          style={{
            width: "100%",
            maxWidth: "500px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h2 style={{ fontSize: "18px", marginBottom: "5px" }}>Shader Code</h2>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "10px",
            }}
          >
            <h3 style={{ fontSize: "16px", marginBottom: "5px" }}>
              Vertex Shader
            </h3>
            <pre
              style={{
                backgroundColor: "#282c34",
                color: "#abb2bf",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
                textAlign: "left",
              }}
            >
              {shaderData.vertex_shader}
            </pre>
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: "4px",
              padding: "10px",
            }}
          >
            <h3 style={{ fontSize: "16px", marginBottom: "5px" }}>
              Fragment Shader
            </h3>
            <pre
              style={{
                backgroundColor: "#282c34",
                color: "#abb2bf",
                padding: "10px",
                borderRadius: "4px",
                overflow: "auto",
                fontSize: "14px",
                whiteSpace: "pre-wrap",
                textAlign: "left",
              }}
            >
              {shaderData.fragment_shader}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
