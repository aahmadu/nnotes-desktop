import { useEffect, useRef, FunctionComponent } from 'react';
import * as d3 from 'd3';

import { calculateLinkDistance, updateFontSize, colours } from './utils';
import { Note, Link } from '../../types/general';

interface GraphViewProps {
  activeNote: Note;
  allNotes: Note[];
  allLinks: Link[];
  onNoteSelect: (note: Note) => void;
}

const GraphView: FunctionComponent<GraphViewProps> = function GraphView({
  activeNote,
  allNotes,
  allLinks,
  onNoteSelect,
}) {
  const viewContainer = useRef(null);
  const d3Container = useRef(null);
  const width = 227;
  const height = 691;
  const simulation = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined>>();
  const textDistance = 10;

  useEffect(() => {
    const viewSpace = d3
      .select(viewContainer.current)
      .attr('class', 'svg-container');
    const svg = d3
      .select(d3Container.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr(
        'style',
        'max-width: 100vh; height: auto; font-family: sans-serif; overflow: visible;',
      );
    svg.append('g').attr('class', 'links');
    svg.append('g').attr('class', 'nodes');

    simulation.current = d3
      .forceSimulation()
      .force(
        'link',
        d3
          .forceLink()
          .id((d) => d.id)
          .distance(calculateLinkDistance),
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    function zoomed(event) {
      const { transform } = event;
      const currentZoomScale = transform.k;

      if (currentZoomScale > 1) {
        svg
          .selectAll('text')
          .style('display', 'block')
          .attr('dy', () => 4);
      } else {
        svg.selectAll('text').style('display', 'none');
      }

      svg.attr(
        'transform',
        `translate(
          ${transform.x - (width / 2) * (1 - transform.k)},
          ${transform.y - (height / 2) * (1 - transform.k)}
        ) scale(${transform.k})`,
      );
    }
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4]) // Limit the zoom scale
      .on('start', (event) => {
        if (event.sourceEvent.type === 'mousedown') {
          viewSpace.style('cursor', 'grabbing');
        }
      })
      .on('end', () => {
        viewSpace.style('cursor', 'default');
      })
      .on('zoom', zoomed)
      .translateExtent([
        [-Infinity, -Infinity],
        [Infinity, Infinity],
      ]) // Allow unlimited panning
      .extent([
        [-width, -height],
        [width, height],
      ]) // Define the zoom extent
      .wheelDelta((event) => {
        // Customize wheel delta to control the inertia speed
        return (
          -event.deltaY *
          (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
        );
      });

    viewSpace.call(zoom);

    // Per-type markers, as they don't inherit styles.
    svg
      .append('defs')
      .selectAll("marker")
      .data(['link', 'outLink', 'inLink'])
      .join("marker")
      .attr('id', (d) => `arrow-${d}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', -0.5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('fill', (d) => colours[d])
      .attr('d', 'M0,-5L10,0L0,5');

    simulation.current.on('tick', () => {
      const updateLinks = d3.select('.links').selectAll('g'); //linksGroup.selectAll('g');
      const updateNodes = d3.select('.nodes').selectAll('g'); //nodesGroup.selectAll('g');
      updateLinks.selectAll('line')
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      updateLinks.selectAll('text')
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2)
        .attr('dy', -5) // You might need to adjust this based on your graph's scale
        .attr('transform', d => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          let angle = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angle > 90 || angle < -90) angle += 180;
          return `rotate(${angle}, ${(d.source.x + d.target.x) / 2}, ${(d.source.y + d.target.y) / 2})`;
        });

      updateNodes.select('circle')
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      updateNodes.select('text')
        .attr("x", d => d.x)
        .attr("y", d => d.y+13);
    });

    return () => {
      if (simulation.current) {
        simulation.current.stop();
      }
      svg.selectAll('*').remove();
    };
  }, []);

  function drag(sim: d3.Simulation<d3.SimulationNodeDatum, undefined>) {
    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  function updateGraph(newNodes, newLinks, activeNodeId) {
    const nodesMap = new Map(
      simulation.current!.nodes().map((node) => [node.id, node]),
    );
    const nodes = newNodes.map((node) => ({
      ...nodesMap.get(node.id),
      ...node,
    }));
    const links = newLinks.map((link) => ({ ...link }));

    simulation.current.nodes(nodes);
    simulation.current.force("link").links(links);

    const svg = d3.select(d3Container.current);
    const nodesGroup = svg.select('.nodes');
    const linksGroup = svg.select('.links');

    // Links
    let updateLinks = linksGroup.selectAll('g').data(links);
    updateLinks.exit().remove();
    const enterLinks = updateLinks.enter().append('g');
    enterLinks.append('line').attr('stroke', colours.link);
    enterLinks
      .append('text')
      .text((d) => d.linkTag)
      .attr('font-size', 6)
      .attr('text-anchor', 'middle')
      .attr('fill', colours.linkText);
    updateLinks = enterLinks.merge(updateLinks);

    // Nodes
    let updateNodes = nodesGroup.selectAll('g').data(nodes, d => d.id);
    updateNodes.exit().remove();
    const enterNodes = updateNodes.enter().append('g');
    enterNodes.append('circle').attr('r', 4).call(drag(simulation.current));;
    enterNodes.append('text')
      .attr('pointer-events', 'none')
      .attr('y', '1em')
      .attr('dy', 1)
      .attr('font-size', 7)
      .attr('text-anchor', 'middle')
      .attr('fill', colours.nodeText);
    updateNodes = enterNodes.merge(updateNodes);

    updateNodes.selectAll('circle')
      .attr('fill', d => d.id === activeNodeId ? colours.selectedNode : colours.node);
    updateNodes.selectAll('text').text(d => d.title);

    function applyLinkStyles(selection, nodeID) {
      selection
        .select('line')
        .style('stroke', d => {
          const sourceID = d.source.id? d.source.id : d.source;
          const targetID = d.target.id? d.target.id : d.target;
          if (nodeID !== undefined && (sourceID === nodeID || targetID === nodeID)) {
            return sourceID === nodeID ? colours.outLink : colours.inLink;
          }
          return colours.link;
        })
        .attr('marker-end', d => {
          const sourceID = d.source.id? d.source.id : d.source;
          const targetID = d.target.id? d.target.id : d.target;
          if (nodeID !== undefined && (sourceID === nodeID || targetID === nodeID)) {
            return sourceID === nodeID ? 'url(#arrow-outLink)' : 'url(#arrow-inLink)';
          }
          return 'url(#arrow-link)';
        });

      selection.select('text').text(d => d.linkTag);
    }
    applyLinkStyles(updateLinks, activeNodeId);
    updateNodes.selectAll('circle').on('mouseenter', (event, d) => {
      d3.select(event.target).attr('fill', colours.selectedNode);
      applyLinkStyles(updateLinks, d.id);
    });

    updateNodes.selectAll('circle').on('click', (event, d) => {
      onNoteSelect(d);
    });

    updateNodes.selectAll('circle').on('mouseleave', (event, d) => {
      if (d.id !== activeNodeId) {
        d3.select(event.target).attr('fill', colours.node);
        console.log(updateLinks)
        applyLinkStyles(updateLinks, activeNodeId);
      }
    });

    simulation.current.alpha(0.8).restart();
  }

  useEffect(() => {
    if (allNotes.length > 0) {
      updateGraph(allNotes, allLinks, activeNote?.id);
    }

  }, [activeNote, allNotes, allLinks]);

  return (
    <div
      ref={viewContainer}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <svg ref={d3Container} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default GraphView;
