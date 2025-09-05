import { useEffect, useRef, useState, FunctionComponent } from 'react';
import * as d3 from 'd3';

import { calculateLinkDistance } from './utils';
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
  const viewContainer = useRef<HTMLDivElement | null>(null);
  const d3Container = useRef<SVGSVGElement | null>(null);
  const width = 227;
  const height = 691;
  const simulation = useRef<d3.Simulation<NodeDatum, LinkDatum>>();
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();
  const viewSelection = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined>>();
  const [focusMode, setFocusMode] = useState(false);

  const getColours = () => {
    const cs = getComputedStyle(document.documentElement);
    return {
      node: cs.getPropertyValue('--graph-node').trim() || '#7c8da5',
      link: cs.getPropertyValue('--graph-link').trim() || '#c7c7c7',
      selectedNode: cs.getPropertyValue('--graph-node-selected').trim() || '#1F2041',
      outLink: cs.getPropertyValue('--graph-link-out').trim() || '#FA8334',
      inLink: cs.getPropertyValue('--graph-link-in').trim() || '#00A9A5',
      nodeText: cs.getPropertyValue('--graph-text').trim() || 'black',
      linkText: cs.getPropertyValue('--graph-text-muted').trim() || 'gray',
    };
  };

  useEffect(() => {
    const viewSpace = d3.select(viewContainer.current as HTMLDivElement);
    viewSelection.current = viewSpace as any;
    const svg = d3
      .select(d3Container.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .attr(
        'style',
        'max-width: 100vh; height: auto; font-family: sans-serif; overflow: visible;',
      );
    // Background grid
    const defs = svg.append('defs');
    defs
      .append('pattern')
      .attr('id', 'minor-grid')
      .attr('width', 20)
      .attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('path')
      .attr('d', 'M 20 0 L 0 0 0 20')
      .attr('fill', 'none')
      .attr('stroke', getColours().link)
      .attr('stroke-width', 0.2)
      .attr('opacity', 0.5);

    defs
      .append('pattern')
      .attr('id', 'major-grid')
      .attr('width', 100)
      .attr('height', 100)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('rect')
      .attr('width', 100)
      .attr('height', 100)
      .attr('fill', 'url(#minor-grid)');

    svg
      .append('rect')
      .attr('x', -width)
      .attr('y', -height)
      .attr('width', width * 2)
      .attr('height', height * 2)
      .attr('fill', 'url(#major-grid)')
      .attr('opacity', 0.4);

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
        if (event?.sourceEvent && event.sourceEvent.type === 'mousedown') {
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

    zoomBehavior.current = zoom as any;
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
      .attr('fill', (d) => (getColours() as any)[d])
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
    // Focus mode: limit to neighbors of active
    let scopedNodes = newNodes;
    let scopedLinks = newLinks;
    const isFocus = focusMode;
    if (isFocus && activeNodeId) {
      const neighborIds = new Set<number>([activeNodeId]);
      for (const l of newLinks) {
        if (l.source === activeNodeId) neighborIds.add(l.target);
        if (l.target === activeNodeId) neighborIds.add(l.source);
      }
      scopedNodes = newNodes.filter((n) => n.id && neighborIds.has(n.id));
      scopedLinks = newLinks.filter((l) => (neighborIds.has(l.source) && neighborIds.has(l.target)));
    }

    const nodes: NodeDatum[] = scopedNodes.map((n) => ({
      id: n.id as number,
      title: n.title || '',
    }));
    const links: LinkDatum[] = scopedLinks.map((l) => ({
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
        g.append('line').attr('stroke', getColours().link).attr('stroke-width', 1.2);
        g.append('text')
          .text((d: any) => d.linkTag)
          .attr('font-size', 6)
          .attr('text-anchor', 'middle')
          .attr('fill', getColours().linkText);
        return g;
      });

    const nodeJoin = nodesGroup
      .selectAll<SVGGElement, any>('g')
      .data(nodes, (d: any) => d.id)
      .join((enter) => {
        const g = enter.append('g');
        g.append('circle')
          .attr('r', 5)
          .attr('stroke', 'transparent')
          .attr('stroke-width', 6)
          .call(drag(sim) as any);
        g.append('text')
          .attr('pointer-events', 'none')
          .attr('y', '1em')
          .attr('dy', 1)
          .attr('font-size', 7)
          .attr('text-anchor', 'middle')
          .attr('fill', getColours().nodeText);
        return g;
      });

    nodeJoin
      .selectAll<SVGCircleElement, any>('circle')
      .attr('fill', (d: any) =>
        activeNodeId && d.id === activeNodeId
          ? getColours().selectedNode
          : getColours().node,
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
            return sourceID === nodeID ? getColours().outLink : getColours().inLink;
          }
          return getColours().link;
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
      d3.select(event.target).attr('fill', getColours().selectedNode);
      applyLinkStyles(linkJoin as any, d.id);
    });

    nodeJoin.selectAll('circle').on('click', (_event: any, d: any) => {
      onNoteSelect(d as any);
    });

    nodeJoin.selectAll('circle').on('mouseleave', (event: any, d: any) => {
      if (d.id !== activeNodeId) {
        d3.select(event.target).attr('fill', getColours().node);
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

  const fitToView = () => {
    if (!d3Container.current || !zoomBehavior.current) return;
    const simNodes = (simulation.current?.nodes() ?? []) as NodeDatum[];
    if (simNodes.length === 0) return;
    const xs = simNodes.map((d) => d.x || 0);
    const ys = simNodes.map((d) => d.y || 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const boxW = Math.max(1, maxX - minX);
    const boxH = Math.max(1, maxY - minY);
    const container = viewContainer.current!;
    const cw = container.clientWidth || 600;
    const ch = container.clientHeight || 400;
    const scale = 0.9 * Math.min(cw / boxW, ch / boxH);
    const tx = cw / 2 - scale * (minX + maxX) / 2;
    const ty = ch / 2 - scale * (minY + maxY) / 2;
    const sel = viewSelection.current || d3.select(d3Container.current);
    (sel as any).transition().duration(250);
    zoomBehavior.current!.transform(sel as any, d3.zoomIdentity.translate(tx, ty).scale(scale));
  };

  return (
    <div
      ref={viewContainer}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <svg ref={d3Container} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          display: 'flex',
          gap: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '6px',
        }}
      >
        <button
          onClick={() => {
            if (!viewSelection.current || !zoomBehavior.current) return;
            const sel = viewSelection.current;
            sel.transition().duration(150);
            zoomBehavior.current!.scaleBy(sel as any, 1.15);
          }}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          +
        </button>
        <button
          onClick={() => {
            if (!viewSelection.current || !zoomBehavior.current) return;
            const sel = viewSelection.current;
            sel.transition().duration(150);
            zoomBehavior.current!.scaleBy(sel as any, 0.87);
          }}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          −
        </button>
        <button
          onClick={() => {
            if (!viewSelection.current || !zoomBehavior.current) return;
            const sel = viewSelection.current;
            sel.transition().duration(200);
            zoomBehavior.current!.transform(sel as any, d3.zoomIdentity);
          }}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          reset
        </button>
        <button
          onClick={() => setFocusMode((prev: any) => {
            const next = !((prev?.current ?? prev) as boolean);
            // Force update
            updateGraph(allNotes, allLinks, activeNote?.id);
            return typeof prev === 'object' ? (prev.current = next, prev) : next;
          })}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          {focusMode ? 'unfocus' : 'focus'}
        </button>
        <button
          onClick={fitToView}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          fit
        </button>
      </div>
    </div>
  );
};

export default GraphView;
