import { useEffect, useRef, FunctionComponent } from 'react';
import * as d3 from 'd3';

interface TreeViewProps {
  treeData: any;
}

const TreeView: FunctionComponent<TreeViewProps> = function TreeView({
  treeData,
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Create the tree layout
    const treeLayout = d3.tree<TreeNode>().size([400, 200]);

    // Create a root node from the treeData and apply the tree layout
    const root = d3.hierarchy(treeData);
    treeLayout(root);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear the svg content before drawing

    // Add links (paths) between nodes
    const links = svg.append('g').selectAll('path')
      .data(root.links())
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x))
      .attr('fill', 'none')
      .attr('stroke', '#555')
      .attr('stroke-width', 1.5);

    // Add nodes (circles)
    const nodes = svg.append('g').selectAll('circle')
      .data(root.descendants())
      .enter().append('circle')
      .attr('class', 'node')
      .attr('cx', d => d.y)
      .attr('cy', d => d.x)
      .attr('r', 5)
      .attr('fill', 'steelblue')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add text labels to nodes
    const labels = svg.append('g').selectAll('text')
      .data(root.descendants())
      .enter().append('text')
      .attr('x', d => d.y)
      .attr('y', d => d.x - 10)  // Adjust the position to appear above the node
      .attr('text-anchor', 'middle')  // Center the text horizontally
      .attr('alignment-baseline', 'middle')  // Center the text vertically
      .text(d => d.data.title)  // Set the text to the name property of the node
      .attr('font-size', '12px')
      .attr('fill', 'black');

  }, [treeData]);

  return (
    <svg ref={svgRef} width="800" height="600" style={{ border: '1px solid black' }}></svg>
  );
};

export default TreeView;
