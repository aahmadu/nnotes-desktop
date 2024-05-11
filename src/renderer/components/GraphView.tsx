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
  const viewContainer = useRef(null);
  const d3Container = useRef(null);
  const width = 227;
  const height = 691;

  useEffect(() => {
    const nodes = allNotes.map((d) => ({ ...d }));
    const links = allLinks.map((link) => ({
      source: link.sourceID,
      target: link.targetID,
      linkTag: link.linkTag,
    }));

    // Create a simulation with several forces.
    const simulation = d3
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

    const textDistance = 6;
    function zoomed(event) {
      const { transform } = event;
      const currentZoomScale = transform.k;
      const adjustedTextDistance = textDistance; // / currentZoomScale;

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

    const baseFontSize = 10; // Define the base font size

    // Define a function to update the font size based on the current zoom scale

    svg.attr('font-size', () => updateFontSize(baseFontSize, svg));

    // Clear SVG before redraw
    svg.selectAll('*').remove();
    const colours = {
      node: '#808080',
      link: '#b5b5b5',
      selectedNode: '#1F2041',
      outLink: '#FA8334',
      inLink: '#00A9A5',
      nodeText: 'black',
      linkText: 'gray',
    };
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

    const linkGroup = svg.append('g');

    // Append lines for links
    const link = linkGroup
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', colours.link)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrow-link)');

    // Append text for links
    const linkText = linkGroup
      .selectAll('.link-text')
      .data(links)
      .enter()
      .append('text')
      .attr('fill', colours.linkText)
      .attr('text-anchor', 'middle')
      .attr('class', 'link-text')
      .text((d) => d.linkTag); // Adjust to access appropriate label or data property;

    const node = svg
      .append('g')
      .attr('fill', 'black')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    node
      .append('circle')
      .attr('fill', (d) =>
        d.id === activeNote?.id ? colours.selectedNode : colours.node,
      )
      .attr('r', 4)
      .on('mouseenter', (event, d) => {
        d3.select(event.target).attr('fill', colours.selectedNode);
        link
          .style('stroke', (l) => {
            if (l.source === d) {
              return colours.outLink;
            } else if (l.target === d) {
              return colours.inLink;
            } else {
              return colours.link;
            }
        }).attr('marker-end', (l) => {
            if (l.source === d) {
              return 'url(#arrow-outLink)';
            } else if (l.target === d) {
              return 'url(#arrow-inLink)';
            } else {
              return 'url(#arrow-link)';
            }
      });
      })
      .on('mouseleave', (event, d) => {
        d3.select(event.target).attr('fill', colours.node); // Reset hovered
        link.style('stroke', colours.link).attr('marker-end', 'url(#arrow-link)');
      });

    node
      .append('text')
      .attr('y', '1em')
      .attr('dy', textDistance)
      .text((d) => d.title)
      .attr('text-anchor', 'middle')
      .attr('fill', colours.nodeText);

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x}, ${d.y})`);

      // Position the text along the line
      linkText
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
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3
        .drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // When this cell is re-run, stop the previous simulation. (This doesn’t
    // really matter since the target alpha is zero and the simulation will
    // stop naturally, but it’s a good practice.)
    // invalidation.then(() => simulation.stop());
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
