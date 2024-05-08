import { useEffect, useRef, FunctionComponent } from 'react';
import * as d3 from 'd3';

import { Note, Link } from '../../types/general';

interface GraphViewProps {
  allNotes: Note[];
  allLinks: Link[];
}

const GraphView: FunctionComponent<GraphViewProps> = function GraphView({
  allNotes,
  allLinks,
}) {
  const d3Container = useRef(null);

  useEffect(() => {
    const linksData = allLinks.map((link) => ({
      source: link.sourceID,
      target: link.targetID,
      linkTag: link.linkTag,
    }));

    function drawGraph(
      nodes: Note[],
      links: {
        source: number;
        target: number;
        linkTag: string;
      }[],
    ) {
      const svg = d3.select(d3Container.current)
        .attr('width', '800')
        .attr('height', '600');

      // Clear SVG before redraw
      svg.selectAll('*').remove();

      const distanceBtwNodes = -200;

      // Initialize the simulation with nodes and link forces.
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          'link',
          d3.forceLink(links).id((d) => d.id),
        )
        .force('charge', d3.forceManyBody().strength(distanceBtwNodes))
        .force('center', d3.forceCenter(200 / 2, 600 / 2));

      // Create SVG lines for links and circles for nodes.
      const link = svg.append("g")
        .attr("stroke", "#B0B0B0")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

      const node = svg.append('g').selectAll('g').data(nodes).join('g');

      node
        .append('circle')
        .attr('r', 4)
        .attr('fill', '#B0B0B0')
        .call(drag(simulation));

      node
        .append('text')
        .text((d) => d.title)
        .style('fill', 'black')
        .style('font-size', '12px')
        .attr('dx', 10)
        .attr('dy', '.35em');

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

        return d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended);
      }

      simulation.on('tick', () => {
        link
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y);

        node.attr('transform', d => `translate(${d.x}, ${d.y})`);
      });
    }
    drawGraph(allNotes, linksData);
  }, []);

  return <svg ref={d3Container} style={{ width: '100%', height: '100%' }} />;
};

export default GraphView;
