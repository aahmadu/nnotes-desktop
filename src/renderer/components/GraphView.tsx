import { useEffect, useRef, FunctionComponent } from 'react';
import * as d3 from 'd3';

import { calculateLinkDistance, updateFontSize } from './utils';
import { Note, Link } from '../../types/general';

interface GraphViewProps {
  activeNote: Note;
  allNotes: Note[];
  allLinks: Link[];
}

const GraphView: FunctionComponent<GraphViewProps> = function GraphView({
  activeNote,
  allNotes,
  allLinks,
}) {
  const updateFunc= useRef(null);
  const prevNotes = useRef<Note[]>([]);
  const isInitialized = useRef(false);
  const viewContainer = useRef(null);
  const d3Container = useRef(null);
  const width = 227;
  const height = 691;
  const simulation = useRef<d3.Simulation<d3.SimulationNodeDatum, undefined>>();
  const textDistance = 10;

  const colours = {
    node: '#808080',
    link: '#b5b5b5',
    selectedNode: '#1F2041',
    outLink: '#FA8334',
    inLink: '#00A9A5',
    nodeText: 'black',
    linkText: 'gray',
  };


  function drag(sim) {
    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      console.log("event", event, event.x);
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      // console.log("event-dragged", event.x, event.y);
      console.log("event", event, event.x);
      d.fx = event.x;
      d.fy = event.y;
      // d3.select(this.parentNode)
      //   .attr('transform', `translate(${event.x}, ${event.y})`);
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

  function initializeGraph() {
    console.log('All notes:', allNotes);
    const nodes = allNotes.map((d) => ({ ...d }));
    const links = allLinks.map((link) => ({
      source: link.source,
      target: link.target,
      linkTag: link.linkTag,
    }));

    // Create a simulation with several forces.
    simulation.current = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(calculateLinkDistance),
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('x', d3.forceX())
      .force('y', d3.forceY());


    function zoomed(event) {
      const { transform } = event;
      const currentZoomScale = transform.k;
      const adjustedTextDistance = textDistance.current; // / currentZoomScale;

      if (currentZoomScale > 1) {
        // Show text only when zoom scale is less than 1
        svg
          .selectAll('text')
          .style('display', 'block')
          .attr('dy', () => adjustedTextDistance);
      } else {
        // Hide text when zoom scale is 1 or greater
        svg.selectAll('text').style('display', 'none');
      }

      svg.attr(
        'transform',
        `translate(${transform.x - (width / 2) * (1 - transform.k)}, ${
          transform.y - (height / 2) * (1 - transform.k)
        }) scale(${transform.k})`,
      );
      //svg.attr('font-size', () => updateFontSize());
    }
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4]) // Limit the zoom scale
      .on('start', () => {console.log("down boy");d3.select('body').style("cursor", "grabbing")})
      .on('end', () => {console.log("up boy");d3.select('body').style("cursor", "default")})
      .on('zoom', zoomed)
      .translateExtent([
        [-Infinity, -Infinity],
        [Infinity, Infinity],
      ]) // Allow unlimited panning
      .extent([
        [-width, -height],
        [width, height],
      ]) // Define the zoom extent
      .filter((event) => {
        // Enable inertia only when the Alt key is not pressed
        return !event?.sourceEvent?.altKey;
      })
      .wheelDelta((event) => {
        // Customize wheel delta to control the inertia speed
        return (
          -event.deltaY *
          (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
        );
      });

    // Wrap the SVG in a larger container
    const viewSpace = d3
      .select(viewContainer.current)
      .attr('class', 'svg-container');

    // Create the SVG container.
    const svg = d3
      .select(d3Container.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr(
        'style',
        'max-width: 100vh; height: auto; font-family: sans-serif; overflow: visible;',
      );

    // Attach zoom behavior to the larger container
    viewSpace.call(zoom);
    // viewSpace.on("mousedown", () => viewSpace.style("cursor", "grabbing"));
    // svg.on("mousedown", () => viewSpace.style("cursor", "grabbing"));
    // svg.on("mouseup", () => viewSpace.style("cursor", "grab"));

    const baseFontSize = 10; // Define the base font size

    // Define a function to update the font size based on the current zoom scale

    svg.attr('font-size', () => updateFontSize(baseFontSize, svg));

    // Clear SVG before redraw
    svg.selectAll('*').remove();

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

    svg.append('g').attr('class', 'links');
    svg.append('g').attr('class', 'nodes');

    updateGraph(nodes, links);
    // const link = svg.select('.links').selectAll('g').selectAll('line');
    // const node = svg.select('.nodes').selectAll('g');

    // simulation.current.on('tick', () => {
    //   link
    //     .attr('x1', (d) => d.source.x)
    //     .attr('y1', (d) => d.source.y)
    //     .attr('x2', (d) => d.target.x)
    //     .attr('y2', (d) => d.target.y);

    //   node.attr('transform', (d) => `translate(${d.x}, ${d.y})`);
    // });



    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    // invalidation.then(() => simulation.stop());
  }

  function updateGraph(nodes, links) {
    const activeNodeId = activeNote?.id;
    const oldNodes = new Map(simulation.current.nodes().map(d => [d.id, d]));
    nodes = nodes.map(d => Object.assign(oldNodes.get(d.id) || {}, d));
    links = links.map(d => Object.assign({}, d));

    const svg = d3.select(d3Container.current);
    // links
    let updateLinks = svg.select('.links').selectAll('g').data(links);
    updateLinks.exit().remove();
    const enterLinks = updateLinks.enter().append('g');
    enterLinks.append('line').attr('stroke', colours.link);
    enterLinks
      .append('text')
      .text((d) => d.linkTag)
      .attr('text-anchor', 'middle')
      .attr('fill', colours.linkText);
    updateLinks = enterLinks.merge(updateLinks);

    // nodes
    let updateNodes = svg.select('.nodes').selectAll('g');
    updateNodes = updateNodes.data(nodes, d => d.id);
    updateNodes.exit().remove();
    const enterNodes = updateNodes.enter().append('g');
    enterNodes.append('circle').attr('r', 4);
    enterNodes.append('text')
      .attr('pointer-events', 'none')
      .attr('y', '1em')
      .attr('dy', textDistance.current)
      .attr('text-anchor', 'middle')
      .attr('fill', colours.nodeText);
    updateNodes = enterNodes.merge(updateNodes);

    updateNodes.selectAll('circle')
    .attr('fill', d => d.id === activeNodeId ? colours.selectedNode : colours.node);
    updateNodes.selectAll('text').text(d => d.title);
    updateLinks.select('text').text(d => d.linkTag);

    updateLinks.select('line')
    .style('stroke', d => {
      if (activeNodeId !== undefined && (activeNodeId === d.source || activeNodeId === d.target)) {
        if (d.source === activeNodeId) return colours.outLink;
        if (d.target === activeNodeId) return colours.inLink;
      }
      return colours.link;
    })
    .attr('marker-end', d => {
      if (activeNodeId !== undefined && (activeNodeId === d.source || activeNodeId === d.target)) {
        if (d.source === activeNodeId) return 'url(#arrow-outLink)';
        if (d.target === activeNodeId) return 'url(#arrow-inLink)';
      }
      return 'url(#arrow-link)';
    });

    updateNodes.selectAll('circle').on('mouseenter', (event, d) => {
      d3.select(event.target).attr('fill', colours.selectedNode);
      updateLinks.select('line')
        .style('stroke', l => {
          if (l.source === d) return colours.outLink;
          if (l.target === d) return colours.inLink;
          return colours.link;
        }).attr('marker-end', l => {
          if (l.source === d) return 'url(#arrow-outLink)';
          if (l.target === d) return 'url(#arrow-inLink)';
          return 'url(#arrow-link)';
        });
    });

    // console.log("simulation.nodes", updateNodes.select('circle'));
    updateNodes.select('circle').call(drag(simulation.current));

      // Set up mouseleave event for nodes
  updateNodes.selectAll('circle').on('mouseleave', () => {
    updateNodes.selectAll('circle').attr('fill', d => d.id === activeNodeId ? colours.selectedNode : colours.node);
    updateLinks.selectAll('line').style('stroke', colours.link).attr('marker-end', 'url(#arrow-link)');
  });

    simulation.current.nodes(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .restart()

    // simulation.current.nodes(nodes);
    // simulation.current.force("link").links(links);
    // simulation.current.alpha(0.8).restart();

    simulation.current.on('tick', () => {
      updateLinks.selectAll('line')
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      updateLinks.selectAll('text')
        .attr('x', (d) => (d.source.x + d.target.x) / 2)
        .attr('y', (d) => (d.source.y + d.target.y) / 2)
        .attr('dy', -5) // You might need to adjust this based on your graph's scale
        .attr('transform', (d) => {
          let angle = Math.atan2(
            d.target.y - d.source.y,
            d.target.x - d.source.x,
          );
          if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
            angle = (angle + Math.PI) % (2 * Math.PI); // Normalize angle to keep text upright
          }
          return `rotate(${(angle * 180) / Math.PI}, ${
            d.source.x + (d.target.x - d.source.x) / 2
          }, ${d.source.y + (d.target.y - d.source.y) / 2})`;
        });

      updateNodes.select('circle')
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      updateNodes.select('text')
        .attr("x", d => d.x)
        .attr("y", d => d.y+13);
    });
  }

  useEffect(() => {
    if (allNotes.length > 0 && allLinks.length > 0) {
      updateGraph(allNotes, allLinks);
      prevNotes.current = allNotes;
    }
  }, [activeNote]);

  useEffect(() => {
    if (!isInitialized.current && allNotes.length > 0 && allLinks.length > 0) {
      initializeGraph();
      isInitialized.current = true;
      prevNotes.current = allNotes;
    }
    if (allNotes.length > 0 && allLinks.length > 0) {
      updateGraph(allNotes, allLinks);
      prevNotes.current = allNotes;
      console.log("gggggg", simulation.current.nodes());
    }

  }, [allNotes, allLinks]);

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
