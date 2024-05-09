import React, { useRef, useEffect } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import ForceSupervisor from 'graphology-layout-force/worker';
import forceAtlas2 from 'graphology-layout-forceatlas2';

const SigmaGraph: FunctionComponent<GraphViewProps> = function GraphView({
  allNotes,
  allLinks,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Initialize sigma with the container and graph data
      const graph = new Graph();
      allNotes.forEach(node => graph.addNode(node.id, { label: node.title, size: 6, color: "gray" }));
      allLinks.forEach(edge => graph.addEdge(edge.sourceID, edge.targetID, { type: "arrow", label: edge.linkTag, size: 2, color: "gray" }));
      // graph.addNode("1", { label: "Node 1", size: 10, color: "blue" });
      // graph.addNode("2", { label: "Node 2", size: 20, color: "red" });
      // graph.addEdge("1", "2", { size: 5, color: "purple" });

      graph.nodes().forEach((node, i) => {
        const angle = (i * 2 * Math.PI) / graph.order;
        graph.setNodeAttribute(node, 'x', 100 * Math.cos(angle));
        graph.setNodeAttribute(node, 'y', 100 * Math.sin(angle));
      });

      const sigmaInstance = new Sigma(graph, containerRef.current, {
        renderEdgeLabels: true,
      });
      const layout = new ForceSupervisor(graph, {
        isNodeFixed: 'fixed',
        settings: {
          attraction: 0.0005,
          repulsion: 0.1,
          gravity: 0.006, // 0.0001
          inertia: 0.6,
          maxMove: 200,
        },
      });
      // const layout = forceAtlas2(graph, {maxIterations: 50});
      layout.start();



      //
      // Drag'n'drop feature
      // ~~~~~~~~~~~~~~~~~~~
      //

      // State for drag'n'drop
      let draggedNode: string | null = null;
      let isDragging = false;

      // On mouse down on a node
      //  - we enable the drag mode
      //  - save in the dragged node in the state
      //  - highlight the node
      //  - disable the camera so its state is not updated
      sigmaInstance.on('downNode', (e) => {
        isDragging = true;
        draggedNode = e.node;
        graph.setNodeAttribute(draggedNode, 'highlighted', true);
      });

      // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
      sigmaInstance.getMouseCaptor().on('mousemovebody', (e) => {
        if (!isDragging || !draggedNode) return;

        // Get new position of node
        const pos = sigmaInstance.viewportToGraph(e);

        graph.setNodeAttribute(draggedNode, 'x', pos.x);
        graph.setNodeAttribute(draggedNode, 'y', pos.y);

        // Prevent sigma to move camera:
        e.preventSigmaDefault();
        e.original.preventDefault();
        e.original.stopPropagation();
      });

      // On mouse up, we reset the autoscale and the dragging mode
      sigmaInstance.getMouseCaptor().on('mouseup', () => {
        if (draggedNode) {
          graph.removeNodeAttribute(draggedNode, 'highlighted');
        }
        isDragging = false;
        draggedNode = null;
      });

      // Disable the autoscale at the first down interaction
      sigmaInstance.getMouseCaptor().on('mousedown', () => {
        if (!sigmaInstance.getCustomBBox())
          sigmaInstance.setCustomBBox(sigmaInstance.getBBox());
      });
      // Clean-up function
      return () => sigmaInstance.kill();
    }
  }, [allNotes, allLinks]); // Re-run effect if nodes or edges change

  return <div ref={containerRef} style={{ height: '100vh', width: '100%' }} />;
};

export default SigmaGraph;
