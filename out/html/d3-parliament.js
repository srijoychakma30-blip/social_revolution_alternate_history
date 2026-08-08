/*
 * MIT License
 * © Copyright 2016 - Geoffrey Brossard (me@geoffreybrossard.fr)
 *
 * Adapted for Brazil on the Brink: A History of the PCdoB.
 * Renders a semicircular parliament diagram from party seat data.
 * Party colors and IDs are defined in game.css and passed in at call time.
 */

d3.parliament = function() {

    /* ── Parameters ───────────────────────────────────────── */
    var width,
        height,
        innerRadiusCoef = 0.4;

    /* ── Entry / update / exit animations ────────────────── */
    var enter = {
            smallToBig:  true,
            fromCenter:  true
        },
        update = {
            animate: true
        },
        exit = {
            bigToSmall: true,
            toCenter:   true
        };

    /* ── Event dispatcher ─────────────────────────────────── */
    var parliamentDispatch = d3.dispatch(
        'click', 'dblclick', 'mousedown', 'mouseenter',
        'mouseleave', 'mousemove', 'mouseout', 'mouseover',
        'mouseup', 'touchcancel', 'touchend', 'touchmove', 'touchstart'
    );


    function parliament(data) {
        console.log(data);
        data.each(function(d) {

            /* ── Dimensions ───────────────────────────────────────────── */
            width  = width  ? width  : this.getBoundingClientRect().width;
            height = width  ? width / 2 : this.getBoundingClientRect().width / 2;

            var outerParliamentRadius = Math.min(width / 2, height);
            var innerParliementRadius = outerParliamentRadius * innerRadiusCoef;

            var svg = d3.select(this);


            /* ── Compute seat count and row layout ────────────────────── */
            var nSeats = 0;
            d.forEach(function(p) {
                nSeats += (typeof p.seats === 'number') ? Math.floor(p.seats) : p.seats.length;
            });

            var nRows        = 0;
            var maxSeatNumber = 0;
            var b            = 0.5;

            (function() {
                var a = innerRadiusCoef / (1 - innerRadiusCoef);
                while (maxSeatNumber < nSeats) {
                    nRows++;
                    b += a;
                    maxSeatNumber = series(function(i) {
                        return Math.floor(Math.PI * (b + i));
                    }, nRows - 1);
                }
            })();


            /* ── Build seat list with cartesian + polar coordinates ───── */
            var rowWidth = (outerParliamentRadius - innerParliementRadius) / nRows;
            var seats    = [];

            (function() {
                var seatsToRemove = maxSeatNumber - nSeats;
                for (var i = 0; i < nRows; i++) {
                    var rowRadius = innerParliementRadius + rowWidth * (i + 0.5);
                    var rowSeats  = Math.floor(Math.PI * (b + i))
                                  - Math.floor(seatsToRemove / nRows)
                                  - (seatsToRemove % nRows > i ? 1 : 0);
                    var anglePerSeat = Math.PI / rowSeats;
                    for (var j = 0; j < rowSeats; j++) {
                        var s    = {};
                        s.polar  = {
                            r:    rowRadius,
                            teta: -Math.PI + anglePerSeat * (j + 0.5)
                        };
                        s.cartesian = {
                            x: s.polar.r * Math.cos(s.polar.teta),
                            y: s.polar.r * Math.sin(s.polar.teta)
                        };
                        seats.push(s);
                    }
                }
            })();

            /* Sort seats by angle (left to right), then outer to inner row */
            seats.sort(function(a, b) {
                return a.polar.teta - b.polar.teta || b.polar.r - a.polar.r;
            });

            /* Assign party data to each seat in order */
            (function() {
                var partyIndex = 0;
                var seatIndex  = 0;
                seats.forEach(function(s) {
                    var party       = d[partyIndex];
                    var nSeatsInParty = typeof party.seats === 'number'
                                      ? party.seats
                                      : party.seats.length;
                    if (seatIndex >= nSeatsInParty) {
                        partyIndex++;
                        seatIndex = 0;
                        party     = d[partyIndex];
                    }
                    s.party = party;
                    s.data  = typeof party.seats === 'number' ? null : party.seats[seatIndex];
                    seatIndex++;
                });
            })();


            /* ── Seat attribute helpers ───────────────────────────────── */
            var seatClasses = function(d) {
                var c = 'seat ';
                c += (d.party && d.party.id) || '';
                return c.trim();
            };
            var seatX       = function(d) { return d.cartesian.x; };
            var seatY       = function(d) { return d.cartesian.y; };
            var seatColor   = function(d) { return d.party.color; };
            var seatOutline = function(d) { return d.party.outline; };
            var seatRadius  = function(d) {
                var r = 0.4 * rowWidth;
                if (d.data && typeof d.data.size === 'number') {
                    r *= d.data.size;
                }
                return r;
            };


            /* ── Render parliament container ──────────────────────────── */
            var container = svg.select('.parliament');
            if (container.empty()) {
                container = svg.append('g');
                container.classed('parliament', true);
            }
            container.attr('transform',
                'translate(' + width / 2 + ',' + outerParliamentRadius + ')');

            var circles = container.selectAll('.seat').data(seats);
            circles.attr('class', seatClasses);


            /* ── Enter: animate new seats in ─────────────────────────── */
            var circlesEnter = circles.enter().append('circle');
            circlesEnter.attr('class', seatClasses);
            circlesEnter.attr('cx',    enter.fromCenter  ? 0 : seatX);
            circlesEnter.attr('cy',    enter.fromCenter  ? 0 : seatY);
            circlesEnter.attr('r',     enter.smallToBig  ? 0 : seatRadius);
            circlesEnter.attr('fill',  seatColor);
            circlesEnter.attr('stroke', seatOutline);

            if (enter.fromCenter || enter.smallToBig) {
                var tEnter = circlesEnter
                    .transition()
                    .duration(function() { return 1000 + Math.random() * 800; });
                if (enter.fromCenter) {
                    tEnter.attr('cx', seatX);
                    tEnter.attr('cy', seatY);
                }
                if (enter.smallToBig) {
                    tEnter.attr('r', seatRadius);
                }
            }

            /* Bind mouse and touch events to each entering circle */
            for (var evt in parliamentDispatch._) {
                (function(evt) {
                    circlesEnter.on(evt, function(e) {
                        parliamentDispatch.call(evt, this, e);
                    });
                })(evt);
            }


            /* ── Update: animate existing seats ──────────────────────── */
            var circlesUpdate = update.animate
                ? circles.transition().duration(function() { return 1000 + Math.random() * 800; })
                : circles;

            circlesUpdate
                .attr('cx',     seatX)
                .attr('cy',     seatY)
                .attr('r',      seatRadius)
                .attr('fill',   seatColor)
                .attr('stroke', seatOutline);


            /* ── Exit: animate removed seats out ─────────────────────── */
            if (exit.toCenter || exit.bigToSmall) {
                var tExit = circles.exit()
                    .transition()
                    .duration(function() { return 1000 + Math.random() * 800; });
                if (exit.toCenter)   { tExit.attr('cx', 0).attr('cy', 0); }
                if (exit.bigToSmall) { tExit.attr('r', 0); }
                tExit.remove();
            } else {
                circles.exit().remove();
            }
        });
    }


    /* ── Chainable setters ────────────────────────────────── */

    parliament.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return parliament;
    };

    /** Deprecated since v1.0.1 — height is derived from width */
    parliament.height = function(value) {
        if (!arguments.length) return height;
        return parliament;
    };

    parliament.innerRadiusCoef = function(value) {
        if (!arguments.length) return innerRadiusCoef;
        innerRadiusCoef = value;
        return parliament;
    };

    parliament.enter = {
        smallToBig: function(value) {
            if (!arguments.length) return enter.smallToBig;
            enter.smallToBig = value;
            return parliament.enter;
        },
        fromCenter: function(value) {
            if (!arguments.length) return enter.fromCenter;
            enter.fromCenter = value;
            return parliament.enter;
        }
    };

    parliament.update = {
        animate: function(value) {
            if (!arguments.length) return update.animate;
            update.animate = value;
            return parliament.update;
        }
    };

    parliament.exit = {
        bigToSmall: function(value) {
            if (!arguments.length) return exit.bigToSmall;
            exit.bigToSmall = value;
            return parliament.exit;
        },
        toCenter: function(value) {
            if (!arguments.length) return exit.toCenter;
            exit.toCenter = value;
            return parliament.exit;
        }
    };

    parliament.on = function(type, callback) {
        parliamentDispatch.on(type, callback);
    };

    return parliament;

    /* ── Utility: sum of series s(i) from i=0 to i=n ─────── */
    function series(s, n) {
        var r = 0;
        for (var i = 0; i <= n; i++) { r += s(i); }
        return r;
    }

};