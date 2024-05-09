import { useRef, useEffect, FunctionComponent } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import * as d3 from 'd3-force';
import { Note, Link } from '../../types/general';

type SigmaGraphProps = {
  allNotes: Note[];
  allLinks: Link[];
};

const SigmaGraph: FunctionComponent<SigmaGraphProps> = function SigmaGraph({
  allNotes,
  allLinks,
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const graph = new Graph();
      allNotes.forEach(node =>
        graph.addNode(node.id, {
          label: node.title,
          size: 6,
          color: 'gray',
          x: Math.random() * 100,
          y: Math.random() * 100,
        })
      );
      allLinks.forEach(edge =>
        graph.addEdge(edge.sourceID, edge.targetID, {
          type: 'arrow',
          label: edge.linkTag,
          size: 3,
          color: 'rgba(128, 128, 128, 0.7)',
          weight: 0,
        })
      );

      const nodes = graph.nodes().map(node => ({
        ...graph.getNodeAttributes(node),
        id: node
      }));

      const links = graph.edges().map(edge => ({
        source: graph.source(edge),
        target: graph.target(edge),
        ...graph.getEdgeAttributes(edge)
      }));

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(100, 100))
        .force("radial", d3.forceRadial(100, containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2).strength(0.4))
        .on("tick", () => {
          nodes.forEach(node => {
            graph.setNodeAttribute(node.id, 'x', node.x);
            graph.setNodeAttribute(node.id, 'y', node.y);
          });
        });

      const sigmaInstance = new Sigma(graph, containerRef.current, {
        renderEdgeLabels: true,
      });

      // Drag handling
      let draggingNode = null;
      sigmaInstance.on('downNode', (event) => {
        draggingNode = event.node;
        const node = simulation.nodes().find(n => n.id === draggingNode);
        node.fx = node.x;
        node.fy = node.y;
        simulation.alphaTarget(0.3).restart();
        // graph.setNodeAttribute(draggingNode, 'highlighted', true);
      });

      sigmaInstance.getMouseCaptor().on('mousemovebody', (event) => {
        if (draggingNode) {
          const pos = sigmaInstance.viewportToGraph(event);
          const node = simulation.nodes().find(n => n.id === draggingNode);
          if (node) {
            node.fx = pos.x;
            node.fy = pos.y;
          }
          // graph.setNodeAttribute(draggingNode, 'x', pos.x);
          // graph.setNodeAttribute(draggingNode, 'y', pos.y);

          // Prevent sigma to move camera:
          event.preventSigmaDefault();
          event.original.preventDefault();
          event.original.stopPropagation();
        }
      });

      sigmaInstance.getMouseCaptor().on('mouseup', () => {
        if (draggingNode) {
          graph.removeNodeAttribute(draggingNode, 'highlighted');
          const node = simulation.nodes().find(n => n.id === draggingNode);
          node.fx = null;
          node.fy = null;
          draggingNode = null;
          simulation.alphaTarget(0).restart();
        }
      });

      sigmaInstance.getMouseCaptor().on('mousedown', () => {
        if (!sigmaInstance.getCustomBBox())
          sigmaInstance.setCustomBBox(sigmaInstance.getBBox());
      });

      return () => {
        sigmaInstance.kill();
        simulation.stop();
      };
    }
  }, [allNotes, allLinks]);

  return <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />;
};

export default SigmaGraph;
