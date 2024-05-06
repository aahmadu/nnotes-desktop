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
    const linksData = allLinks.map(link => ({
      source: link.sourceID,
      target: link.targetID,
      linkTag: link.linkTag,
    }));

    function drawGraph(nodes, links) {
      console.log(allLinks)
      const svg = d3.select(d3Container.current);
      svg.attr('width', '800').attr('height', '600'); // set the size of the SVG element

      // Clear SVG before redraw
      svg.selectAll("*").remove();

      // Create a simulation for positioning graph elements
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(400 / 2, 600 / 2));

      const link = svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value))
        .attr("marker-end", "url(#arrowhead)");

      const node = svg.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", colorNode)
        .call(drag(simulation));

      node.append("title")
          .text(d => d.title);

      const linkText = svg.append("g")
          .selectAll("text")
          .data(links)
          .join("text")
          .attr("font-size", "10px")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text(d => `${d.linkTag} ${d.source < d.target ? '→' : '←'}`);

      simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        linkText
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);
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

        return d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }

      function colorNode(d) {
        return d.group === '1' ? 'red' : 'blue'; // Customize as per your node properties
      }
    }
    drawGraph(allNotes, linksData);
  }, []);

  return (
    <svg ref={d3Container} style={{ width: '100%', height: '100%' }} />
  );
};

export default GraphView;
