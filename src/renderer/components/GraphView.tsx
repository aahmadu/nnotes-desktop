import { useEffect, useRef, FunctionComponent } from 'react';
import * as d3 from 'd3';

import { calculateLinkDistance, colours } from './utils';
import { Note, Link } from '../../types/general';

interface GraphViewProps {
  activeNote: Note;
  allNotes: Note[];
  allLinks: Link[];
  onNoteSelect: (note: Note) => void;
}

type NodeDatum = { id: number; title: string } & d3.SimulationNodeDatum;
type LinkDatum = { linkTag: string } & d3.SimulationLinkDatum<NodeDatum>;

const GraphView: FunctionComponent<GraphViewProps> = ({
  activeNote,
  allNotes,
  allLinks,
  onNoteSelect,
}) => {
  const viewContainer = useRef(null);
  const d3Container = useRef<SVGSVGElement | null>(null);
  const width = 227;
  const height = 691;
  const simulation = useRef<d3.Simulation<NodeDatum, LinkDatum>>();

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
      .forceSimulation<NodeDatum, LinkDatum>()
      .force(
        'link',
        d3
          .forceLink<NodeDatum, LinkDatum>()
          .id((d: any) => d.id)
          .distance((l: any) => calculateLinkDistance({ linkTag: l.linkTag })),
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('x', d3.forceX())
      .force('y', d3.forceY());

    function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
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
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4]) // Limit the zoom scale
      .on('start', (event: any) => {
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
      .wheelDelta((event: any) => {
        // Customize wheel delta to control the inertia speed
        return (
          -event.deltaY *
          (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002)
        );
      });

    viewSpace.call(zoom as any);

    // Per-type markers, as they don't inherit styles.
    svg
      .append('defs')
      .selectAll('marker')
      .data(['link', 'outLink', 'inLink'])
      .join('marker')
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
      const updateLinks = d3.select('.links').selectAll<SVGGElement, any>('g');
      const updateNodes = d3.select('.nodes').selectAll<SVGGElement, any>('g');
      updateLinks
        .selectAll<SVGLineElement, any>('line')
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      updateLinks
        .selectAll<SVGTextElement, any>('text')
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2)
        .attr('dy', -5)
        .attr('transform', (d: any) => {
          const dx = d.target.x - d.source.x;
          const dy = d.target.y - d.source.y;
          let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          if (angle > 90 || angle < -90) angle += 180;
          return `rotate(${angle}, ${(d.source.x + d.target.x) / 2}, ${
            (d.source.y + d.target.y) / 2
          })`;
        });

      updateNodes
        .select<SVGCircleElement>('circle')
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);
      updateNodes
        .select<SVGTextElement>('text')
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y + 13);
    });

    return () => {
      if (simulation.current) {
        simulation.current.stop();
      }
      svg.selectAll('*').remove();
    };
  }, []);

  function drag(sim: d3.Simulation<NodeDatum, LinkDatum>) {
    function dragstarted(
      event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>,
      d: any,
    ) {
      if (!event.active) sim.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(
      event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>,
      d: any,
    ) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(
      event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>,
      d: any,
    ) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3
      .drag<SVGCircleElement, NodeDatum>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  function updateGraph(
    newNodes: Note[],
    newLinks: Link[],
    activeNodeId?: number,
  ) {
    const nodes: NodeDatum[] = newNodes.map((n) => ({
      id: n.id as number,
      title: n.title || '',
    }));
    const links: LinkDatum[] = newLinks.map((l) => ({
      linkTag: l.linkTag,
      source: l.source,
      target: l.target,
    }));

    const sim = simulation.current!;
    sim.nodes(nodes);
    (sim.force('link') as d3.ForceLink<NodeDatum, LinkDatum>).links(links);

    const svg = d3.select(d3Container.current as SVGSVGElement);
    const nodesGroup = svg.select('.nodes');
    const linksGroup = svg.select('.links');

    const linkJoin = linksGroup
      .selectAll<SVGGElement, any>('g')
      .data(
        links,
        (d: any) =>
          `${(d.source as any).id ?? d.source}-${
            (d.target as any).id ?? d.target
          }-${d.linkTag}`,
      )
      .join((enter) => {
        const g = enter.append('g');
        g.append('line').attr('stroke', colours.link);
        g.append('text')
          .text((d: any) => d.linkTag)
          .attr('font-size', 6)
          .attr('text-anchor', 'middle')
          .attr('fill', colours.linkText);
        return g;
      });

    const nodeJoin = nodesGroup
      .selectAll<SVGGElement, any>('g')
      .data(nodes, (d: any) => d.id)
      .join((enter) => {
        const g = enter.append('g');
        g.append('circle')
          .attr('r', 4)
          .call(drag(sim) as any);
        g.append('text')
          .attr('pointer-events', 'none')
          .attr('y', '1em')
          .attr('dy', 1)
          .attr('font-size', 7)
          .attr('text-anchor', 'middle')
          .attr('fill', colours.nodeText);
        return g;
      });

    nodeJoin
      .selectAll<SVGCircleElement, any>('circle')
      .attr('fill', (d: any) =>
        activeNodeId && d.id === activeNodeId
          ? colours.selectedNode
          : colours.node,
      );
    nodeJoin.selectAll<SVGTextElement, any>('text').text((d: any) => d.title);

    const applyLinkStyles = (
      selection: d3.Selection<SVGGElement, any, any, any>,
      nodeID?: number,
    ) => {
      selection
        .select('line')
        .style('stroke', (d: any) => {
          const sourceID = (d.source as any).id ?? d.source;
          const targetID = (d.target as any).id ?? d.target;
          if (
            nodeID !== undefined &&
            (sourceID === nodeID || targetID === nodeID)
          ) {
            return sourceID === nodeID ? colours.outLink : colours.inLink;
          }
          return colours.link;
        })
        .attr('marker-end', (d: any) => {
          const sourceID = (d.source as any).id ?? d.source;
          const targetID = (d.target as any).id ?? d.target;
          if (
            nodeID !== undefined &&
            (sourceID === nodeID || targetID === nodeID)
          ) {
            return sourceID === nodeID
              ? 'url(#arrow-outLink)'
              : 'url(#arrow-inLink)';
          }
          return 'url(#arrow-link)';
        });

      selection.select('text').text((d: any) => d.linkTag);
    };
    applyLinkStyles(linkJoin, activeNodeId);

    nodeJoin.selectAll('circle').on('mouseenter', (event: any, d: any) => {
      d3.select(event.target).attr('fill', colours.selectedNode);
      applyLinkStyles(linkJoin as any, d.id);
    });

    nodeJoin.selectAll('circle').on('click', (_event: any, d: any) => {
      onNoteSelect(d as any);
    });

    nodeJoin.selectAll('circle').on('mouseleave', (event: any, d: any) => {
      if (d.id !== activeNodeId) {
        d3.select(event.target).attr('fill', colours.node);
        applyLinkStyles(linkJoin as any, activeNodeId);
      }
    });

    simulation.current!.alpha(0.8).restart();
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
