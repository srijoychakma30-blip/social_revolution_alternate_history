/*
 * d3-linegraph.js
 * Generates a line graph of multiple parties across multiple poll dates.
 * Adapted for Brazil on the Brink: A History of the PCdoB.
 */

function addMonths(date, months) {
    date = new Date(date);
    var d = date.getDate();
    date.setMonth(date.getMonth() + months);
    if (date.getDate() !== d) {
        date.setDate(0);
    }
    return date;
}


d3.linegraph = function(noTicks, noDots, parties, partyColors, partyNames, dataMax, dataMin, additionalMonths) {

    /* ── Default parameters ───────────────────────────────────────────────
     * Parties ordered left to right on the political spectrum.
     * Colors sourced from historical party iconography — see game.css.
     * ──────────────────────────────────────────────────────────────────── */
    if (!parties) {
        parties = ['pcdo', 'pcb', 'psb', 'ptb', 'psd', 'udn', 'arena', 'other'];
    }

    if (!partyColors) {
        partyColors = {
            'pcdo':  '#CC0000',  /* PCdoB — revolutionary red */
            'pcb':   '#990000',  /* PCB — darker crimson, the "revisionists" */
            'psb':   '#E8507A',  /* PSB — socialist rose */
            'ptb':   '#E83030',  /* PTB — trabalhista red */
            'psd':   '#4A6FA5',  /* PSD — conservative centre blue */
            'udn':   '#1A237E',  /* UDN — dark navy, the right */
            'arena': '#6B6B2A',  /* Arena — military olive, post-coup */
            'other': '#a0a0a0'   /* Others */
        };
    }

    if (!partyNames) {
        partyNames = {
            'pcdo':  'PCdoB',
            'pcb':   'PCB',
            'psb':   'PSB',
            'ptb':   'PTB',
            'psd':   'PSD',
            'udn':   'UDN',
            'arena': 'Arena',
            'other': 'Others'
        };
    }

    if (!additionalMonths) {
        additionalMonths = 10;
    }

    /* ── Chart dimensions and margins ────────────────────────────────────*/
    var width      = 500;
    var height     = 400;
    var marginTop    = 20;
    var marginRight  = 20;
    var marginBottom = 50;
    var marginLeft   = 40;


    function linegraph(dataset) {
        dataset.each(function(data) {

            const dates  = data.map(d => new Date(d.date));
            const series = parties.map(party =>
                data.map(d => ({ x: new Date(d.date), y: d[party], series: party }))
            );

            /* ── X scale ──────────────────────────────────────────────────
             * Starts January 1958 — early enough to show pre-crisis Brazil
             * and the period before the PCdoB's 1962 split from the PCB.
             * ────────────────────────────────────────────────────────────*/
            const maxDate = d3.max(dates);
            const xScale = d3.scaleUtc(
                [new Date(1958, 0), addMonths(maxDate, additionalMonths)],
                [marginLeft, width - marginRight]
            );

            var xaxis = noTicks
                ? d3.axisBottom()
                      .tickFormat(d3.timeFormat('%b %Y'))
                      .ticks(10)
                      .scale(xScale)
                : d3.axisBottom()
                      .tickFormat(d3.timeFormat('%b %Y'))
                      .tickValues(dates)
                      .scale(xScale);

            /* ── Y scale ──────────────────────────────────────────────────
             * Auto-ranges from the two most electorally significant parties
             * (PCdoB and UDN) if no explicit bounds are provided.
             * ────────────────────────────────────────────────────────────*/
            if (!dataMax) {
                const maxPCDO = d3.max(data, d => d.pcdo);
                const maxUDN  = d3.max(data, d => d.udn);
                dataMax = (maxPCDO >= maxUDN ? maxPCDO : maxUDN) + 10;
                dataMin = 0;
            }
            const yScale = d3.scaleLinear(
                [dataMin, dataMax],
                [height - marginBottom, marginTop]
            );

            var svg = d3.select(this);

            /* ── Axes ─────────────────────────────────────────────────── */
            svg.append('g')
                .attr('transform', `translate(0,${height - marginBottom})`)
                .call(xaxis)
                .selectAll('text')
                .attr('text-anchor', 'end')
                .attr('dx', '-0.8em')
                .attr('dy', '0.1em')
                .attr('transform', 'rotate(-30)');

            svg.append('g')
                .attr('transform', `translate(${marginLeft},0)`)
                .call(d3.axisLeft(yScale));

            /* ── Line generator ───────────────────────────────────────── */
            const partyLine = (party) => d3.line()
                .x(d => xScale(new Date(d.date)))
                .y(d => yScale(d[party]));

            /* ── Draw lines ───────────────────────────────────────────── */
            for (const party of parties) {
                svg.append('path')
                    .attr('fill', 'none')
                    .attr('stroke', partyColors[party])
                    .attr('stroke-width', 1.5)
                    .attr('class', party + ' party-line')
                    .attr('id', party + '-line')
                    .attr('series', party)
                    .attr('d', partyLine(party)(data))
                    .on('mouseover', function() {
                        d3.selectAll('.party-line').attr('stroke-width', 0.1);
                        d3.selectAll('.party-node').attr('fill-opacity', 0.1);
                        d3.selectAll('.party-label').attr('opacity', 0.1);
                        d3.selectAll('.' + party + '-node').attr('fill-opacity', 1);
                        d3.selectAll('.' + party + '-label').attr('opacity', 1);
                        d3.select(this).attr('stroke-width', 5);
                    })
                    .on('mouseout', function() {
                        d3.selectAll('.party-line').attr('stroke-width', 1.5);
                        d3.selectAll('.party-node').attr('fill-opacity', 1);
                        d3.selectAll('.party-label').attr('opacity', 1);
                    });
            }

            /* ── Draw nodes (dots) ────────────────────────────────────── */
            if (!noDots) {
                svg.selectAll('.series')
                    .data(series)
                  .enter().append('g')
                    .selectAll('.point')
                    .data(d => d)
                  .enter().append('circle')
                    .attr('class', d => d.series + ' ' + d.series + '-node party-node')
                    .attr('fill', d => partyColors[d.series])
                    .attr('series', d => d.series)
                    .attr('r', 4)
                    .attr('cx', d => xScale(d.x))
                    .attr('cy', d => yScale(d.y))
                    .on('mouseover', function() {
                        const series = d3.select(this).attr('series');
                        d3.selectAll('.party-line').attr('stroke-width', 0.1);
                        d3.selectAll('.party-node').attr('fill-opacity', 0.1);
                        d3.selectAll('.party-label').attr('opacity', 0.1);
                        d3.selectAll('.' + series + '-node').attr('fill-opacity', 1);
                        d3.selectAll('#' + series + '-line').attr('stroke-width', 5);
                        d3.selectAll('.' + series + '-label').attr('opacity', 1);
                    })
                    .on('mouseout', function() {
                        d3.selectAll('.party-line').attr('stroke-width', 1.5);
                        d3.selectAll('.party-node').attr('fill-opacity', 1);
                        d3.selectAll('.party-label').attr('opacity', 1);
                    });
            }

            /* ── Draw right-hand labels ───────────────────────────────── */
            svg.selectAll('.labels')
                .data(series)
              .enter().append('text')
                .text(s => partyNames[s[0].series])
                .attr('series', s => s[0].series)
                .attr('font-size', '0.8em')
                .attr('class', s => s[0].series + '-label party-label')
                .attr('x', s => xScale(s[s.length - 1].x) + 15)
                .attr('y', s => yScale(s[s.length - 1].y) + 5)
                .on('mouseover', function() {
                    const series = d3.select(this).attr('series');
                    d3.selectAll('.party-line').attr('stroke-width', 0.1);
                    d3.selectAll('.party-node').attr('fill-opacity', 0.1);
                    d3.selectAll('.party-label').attr('opacity', 0.1);
                    d3.selectAll('.' + series + '-node').attr('fill-opacity', 1);
                    d3.selectAll('#' + series + '-line').attr('stroke-width', 5);
                    d3.selectAll('.' + series + '-label').attr('opacity', 1);
                })
                .on('mouseout', function() {
                    d3.selectAll('.party-line').attr('stroke-width', 1.5);
                    d3.selectAll('.party-node').attr('fill-opacity', 1);
                    d3.selectAll('.party-label').attr('opacity', 1);
                });
        });
    }


    /* ── Chainable setters ────────────────────────────────────────────── */

    linegraph.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return linegraph;
    };

    linegraph.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return linegraph;
    };

    linegraph.parties = function(value) {
        if (!arguments.length) return parties;
        parties = value;
        return linegraph;
    };

    linegraph.partyNames = function(value) {
        if (!arguments.length) return partyNames;
        partyNames = value;
        return linegraph;
    };

    linegraph.partyColors = function(value) {
        if (!arguments.length) return partyColors;
        partyColors = value;
        return linegraph;
    };

    return linegraph;
};