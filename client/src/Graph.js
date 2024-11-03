import * as Plot from "@observablehq/plot"
import {useEffect, useRef} from "react";

function Graph(props) {
    const containerRef = useRef();

    useEffect(() => {
        const plot = Plot.plot({
            marginLeft : 50,
            marks: [
                Plot.ruleY([0], {strokeWidth: 3}),
                Plot.ruleX([props.min_turnout]),
                Plot.ruleX([props.max_turnout]),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : props.max_turnout * 0.1}], {x : "Total", y : "Margin", stroke : "blue", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : props.max_turnout * 0.05}], {x : "Total", y : "Margin", stroke : "blue", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : props.max_turnout * 0.04}], {x : "Total", y : "Margin", stroke : "blue", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : props.max_turnout * 0.03}], {x : "Total", y : "Margin", stroke : "blue", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : props.max_turnout * 0.02}], {x : "Total", y : "Margin", stroke : "blue", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : props.max_turnout * 0.01}], {x : "Total", y : "Margin", stroke : "blue", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : -props.max_turnout * 0.1}], {x : "Total", y : "Margin", stroke : "red", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : -props.max_turnout * 0.05}], {x : "Total", y : "Margin", stroke : "red", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : -props.max_turnout * 0.04}], {x : "Total", y : "Margin", stroke : "red", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : -props.max_turnout * 0.03}], {x : "Total", y : "Margin", stroke : "red", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : -props.max_turnout * 0.02}], {x : "Total", y : "Margin", stroke : "red", strokeWidth: 0.5}),
                Plot.lineY([{Total : 0, Margin : 0}, {Total : props.max_turnout, Margin : -props.max_turnout * 0.01}], {x : "Total", y : "Margin", stroke : "red", strokeWidth: 0.5}),
                Plot.lineY(props.margin_history.map((row) => ({Total : row["total"], Margin : row["margin"]})), {x : "Total", y : "Margin"}),
                Plot.dot([{Total : props.margin_history[props.margin_history.length - 1]["total"], Margin : props.margin_history[props.margin_history.length - 1]["margin"]}], {x : "Total", y : "Margin", stroke : "green", fill : "green"})
            ]
        })
        containerRef.current.append(plot);
        return () => plot.remove();
    })

    return <div ref={containerRef} />;
}
export default Graph