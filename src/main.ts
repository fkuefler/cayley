import ForceGraph3D from "3d-force-graph";
import * as THREE from "three";

import rawGroupData from "../tools/cayley_graphs.json";

interface JsonEdge {
  source: string;
  target: string;
  gen_index: number;
}

interface JsonGroup {
  id: string;
  name: string;
  order: number;
  generators: string[];
  nodes: string[];
  edges: JsonEdge[];
}

const GEN_COLORS = ['#9e0059', '#390099', '#ff0054', '#ff5400', '#ffbd00'];

const appDiv = document.getElementById('app')!;

const overlay = document.createElement('div');
overlay.style.position = 'absolute';
overlay.style.top = '20px';
overlay.style.left = '20px';
overlay.style.zIndex = '999';
overlay.innerHTML = `
  <div style="background: rgba(0,0,0,0.8); padding: 10px; border-radius: 8px; color: white; font-family: sans-serif;">
    <label>Select Group:</label><br/>
    <select id="group-select" style="margin-top: 5px; padding: 5px; width: 200px; background: #000000; color: white; border: 1px solid #555; color-scheme: dark;">
    </select>
    <button id="reset-btn" style="margin-top: 10px; padding: 5px 10px; background: #000000; color: white; border: 1px solid #777; border-radius: 4px; cursor: pointer;">
    Reset View </button>
    <div id="legend" style="margin-top: 10px; font-size: 0.8em;"></div>
  </div>
`;
document.body.appendChild(overlay);

// Particle toggle button
const particleBtn = document.createElement('button');
particleBtn.innerHTML = "Particles: OFF";
Object.assign(particleBtn.style, {
  position: 'absolute',
  top: '20px',
  right: '20px',
  zIndex: '999',
  padding: '10px',
  background: 'rgba(0,0,0,0.8)',
  color: '#aaa',
  border: '1px solid #555',
  borderRadius: '8px',
  fontFamily: 'sans-serif',
  cursor: 'pointer'
});
document.body.appendChild(particleBtn);

// Create the Info Button (Bottom Right)
const infoBtn = document.createElement('button');
infoBtn.innerHTML = "?";
Object.assign(infoBtn.style, {
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  width: '40px',
  height: '40px',
  zIndex: '1001',
  borderRadius: '50%',
  border: '2px solid white',
  background: '#333',
  color: 'white',
  fontSize: '20px',
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 0 10px rgba(255,255,255,0.2)'
});
document.body.appendChild(infoBtn);

// Create the Side Panel (Hidden off-screen by default)
const infoPanel = document.createElement('div');
Object.assign(infoPanel.style, {
  position: 'fixed',
  top: '0',
  right: '0',
  width: '30vw',
  minWidth: '300px',
  height: '100vh',
  background: 'rgba(20, 20, 20, 0.95)',
  borderLeft: '1px solid #444',
  zIndex: '1000',
  transform: 'translateX(100%)',
  transition: 'transform 0.2s ease-in-out',
  padding: '30px',
  boxSizing: 'border-box',
  color: '#ddd',
  fontFamily: 'sans-serif',
  overflowY: 'auto',
  boxShadow: '-5px 0 15px rgba(0,0,0,0.5)',
  colorScheme: 'dark'
});

// Add Content
infoPanel.innerHTML = `
  <h2 style="margin-top:0; color:white;">Info</h2>
  <hr style="border:0; border-top:1px solid #444; margin: 15px 0;">

  <h3 style="color:#44aa88;">What are these?</h3>
  <p style="line-height: 1.5;">
    These are <a href="https://en.wikipedia.org/wiki/Cayley_graph" target="_blank" style="color: #44aa88;">Cayley Graphs</a>. 
    The <strong>Nodes</strong> (spheres) are elements of the group. 
    The <strong>Edges</strong> represent multiplying an element by a generator.
    <br><br>
    All finite groups of order &le;50 are included here (up to isomorphism), along with a few interesting bigger groups.
  </p>

  <h3 style="color:#44aa88;">How were these made?</h3>
  <p style="line-height: 1.5;">
    The group data is from SageMath, the graphing is handled by 3d-force-graph, and the rendering is done with Three.js.
  </p>

  <h3 style="color:#44aa88;">Why are some generators and graphs different than expected?</h3>
  <p style="line-height: 1.5;">
    You may notice that some groups have different generators than what you might expect, or that some well-known graphs look different (e.x. D4, C6). This is because SageMath chooses minimal generators for each group, which may not match conventional choices. The groups are still isomorphic, but because of generator choice the graphs may look different.

  <h3 style="color:#44aa88;">Bugs/Improvements</h3>
  <p style="line-height: 1.5;">
    To report errors or suggest improvements, please open an issue on <a href="https://github.com/fkuefler/cayley/issues" target="_blank" style="color: #44aa88;">GitHub</a>.
  </p>

  <button id="close-panel-btn" style="
    position: absolute; top: 20px; right: 20px; 
    background: transparent; border: none; color: #888; 
    font-size: 24px; cursor: pointer;">
    &#10005;
  </button>
`;

document.body.appendChild(infoPanel);

// Logic to Toggle Slide
let isPanelOpen = false;

const togglePanel = () => {
  isPanelOpen = !isPanelOpen;
  // Slide in (0%) or Slide out (100%)
  infoPanel.style.transform = isPanelOpen ? 'translateX(0%)' : 'translateX(100%)';
};

infoBtn.addEventListener('click', togglePanel);
infoPanel.querySelector('#close-panel-btn')!.addEventListener('click', togglePanel);

const Graph = ForceGraph3D()(appDiv)
  .backgroundColor('#000000')
  .linkWidth(4)
  .linkDirectionalArrowLength(10)
  .linkDirectionalArrowRelPos(1)
  .linkColor((link: any) => GEN_COLORS[link.gen_index % GEN_COLORS.length])
  .nodeOpacity(0.5)
  .linkOpacity(0.75)
  .nodeThreeObject(() => {
    const geometry = new THREE.SphereGeometry(5.0);
    const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 });
    return new THREE.Mesh(geometry, material);
  });

function loadGroup(groupID: string) {
  const group = (rawGroupData as JsonGroup[]).find(g => g.id === groupID);
  if (!group) return;

  const legendDiv = document.getElementById('legend');
  if (legendDiv) {
    legendDiv.innerHTML = group.generators.map((gen, idx) => `
        <div style="display: flex; align-items: center; gap: 5px; margin-bottom: 2px;">
          <div style="width: 10px; height: 10px; background: ${GEN_COLORS[idx % GEN_COLORS.length]}; border-radius: 50%;"></div>
          <span>Generator: ${gen}</span>
        </div>
      `).join('');
  }

  Graph.graphData({
    nodes: group.nodes.map(n => ({ id: n })),
    links: group.edges.map(e => ({
      source: e.source,
      target: e.target,
      gen_index: e.gen_index
    }))
  });

  const numEdges = group.edges.length;
  const decay = Math.max(0.001, Math.min(1, 1 / (numEdges + 100))); // Clamp decay between 0.001 and 1
  Graph.d3AlphaDecay(decay);

  Graph.d3Force('charge')!.strength(-100);
}

const select = document.getElementById('group-select') as HTMLSelectElement;
const groups = rawGroupData as JsonGroup[];

groups.forEach(g => {
  const option = document.createElement('option');
  option.value = g.id;
  option.text = `${g.name} (Order: ${g.order})`;
  select.appendChild(option);
});

select.addEventListener('change', (e) => {
  loadGroup((e.target as HTMLSelectElement).value);
});

if (groups.length > 0) {
  const defaultGroup = groups[groups.length - 3];
  select.value = defaultGroup.id;
  loadGroup(defaultGroup.id);
}

document.getElementById('reset-btn')!.addEventListener('click', () => {
  Graph.zoomToFit(1000);
});

let particlesEnabled = false;
particleBtn.addEventListener('click', () => {
  particlesEnabled = !particlesEnabled;
  Graph.linkDirectionalParticles(particlesEnabled ? 4 : 0);
  Graph.linkDirectionalParticleWidth(particlesEnabled ? 3 : 0);
  Graph.linkDirectionalParticleColor(() => 'white');
  Graph.linkDirectionalParticleSpeed(0.008);

  particleBtn.innerHTML = `Particles: ${particlesEnabled ? 'ON' : 'OFF'}`;
  particleBtn.style.color = particlesEnabled ? 'white' : '#aaa';
});