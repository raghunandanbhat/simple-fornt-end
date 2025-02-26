import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

type ShaderData = {
  vertex: string;
  fragment: string;
  uniforms: { [key: string]: THREE.IUniform };
  vertexData: { positions: number[]; indices: number[] };
};

export default function ShaderDisplay() {
  const [description, setDescription] = useState<string>("");
  const [shaderData, setShaderData] = useState<ShaderData | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const fetchShaderCode = async () => {
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
        throw new Error("Failed to fetch shader code");
      }

      const data = await response.json();
      const { vertex_shader, fragment_shader, uniforms, vertex_data } =
        data.response;

      setShaderData({
        vertex: vertex_shader,
        fragment: fragment_shader,
        uniforms: {
          u_resolution: { value: new THREE.Vector2(...uniforms.u_resolution) },
          u_time: { value: 0.0 },
        },
        vertexData: {
          positions: vertex_data.positions,
          indices: vertex_data.indices,
        },
      });
    } catch (error) {
      console.error("Error fetching shader code:", error);
    }
  };

  useEffect(() => {
    if (!shaderData || !shaderData.vertex || !shaderData.fragment) return;

    console.log("Vertex positions:", shaderData.vertexData.positions);
    console.log("Vertex indices:", shaderData.vertexData.indices);

    const positions = new Float32Array(shaderData.vertexData.positions);
    const indices = new Uint16Array(shaderData.vertexData.indices);

    if (positions.some(isNaN)) {
      console.error("Invalid vertex data: positions array contains NaN values");
      return;
    }

    if (indices.some(isNaN)) {
      console.error("Invalid vertex data: indices array contains NaN values");
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    // Store the current value of canvasRef.current in a variable
    const canvasContainer = canvasRef.current;
    if (canvasContainer) {
      canvasContainer.appendChild(renderer.domElement);
    }

    renderer.setSize(500, 500);

    // Create geometry from vertex data
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    // Create shader material
    const material = new THREE.ShaderMaterial({
      vertexShader: shaderData.vertex,
      fragmentShader: shaderData.fragment,
      uniforms: shaderData.uniforms,
    });

    console.log("BufferGeometry:", geometry);
    console.log("ShaderMaterial:", material);

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    console.log("Mesh:", mesh);

    camera.position.z = 2;

    sceneRef.current = scene;
    rendererRef.current = renderer;
    materialRef.current = material;

    const animate = () => {
      requestAnimationFrame(animate);

      // Update u_time uniform
      if (materialRef.current) {
        materialRef.current.uniforms.u_time.value =
          (Date.now() - startTimeRef.current) / 1000;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      renderer.dispose();
      if (canvasContainer) {
        // Use the stored variable in the cleanup function
        canvasContainer.removeChild(renderer.domElement);
      }
    };
  }, [shaderData]);

  return (
    <div>
      <div ref={canvasRef} style={{ width: 500, height: 500 }}></div>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe your shader"
      />
      <button onClick={fetchShaderCode}>Generate Shader</button>

      <pre style={{ textAlign: "left", whiteSpace: "pre-wrap" }}>
        {shaderData?.vertex
          ? shaderData.vertex
          : "--------------Shader vertex--------------"}
        {"\n\n\n"}
        {shaderData?.fragment
          ? shaderData.fragment
          : "--------------Shader fragment--------------"}
      </pre>
    </div>
  );
}
