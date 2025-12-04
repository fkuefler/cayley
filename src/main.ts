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
    <select id="group-select" style="margin-top: 5px; padding: 5px; width: 200px; background: #000000; color: white; border: 1px solid #555;">
    </select>
    <button id="reset-btn" style="margin-top: 10px; padding: 5px 10px; background: #000000; color: white; border: 1px solid #777; border-radius: 4px; cursor: pointer;">
    Reset View </button>
    <div id="legend" style="margin-top: 10px; font-size: 0.8em;"></div>
  </div>
`;
document.body.appendChild(overlay);

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
    links: group.edges
  });

  const numEdges = group.edges.length;
  const decay = Math.max(0.001, Math.min(1, 1 / (numEdges * 5))); // Clamp decay between 0.001 and 1
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