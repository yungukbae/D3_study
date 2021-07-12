
const dims = { height: 300, width: 300, radius: 150};
const cent = { x: (dims.width / 2 + 5), y: (dims.height / 2 + 5)}


const svg = d3.select('.canvas')
    .append('svg')
    .attr('width', dims.width + 150)
    .attr('height',dims.height + 150)

const graph = svg.append('g')
    .attr('transform',`translate(${cent.x},${cent.y})`);

const pie = d3.pie()    //pie generator
    .sort(null)         //sort data
    .value(d => d.cost) //
    //the value we are evaluating to create the pie angles

// const angles = pie([
//     {name:'rent', cost:500},
//     {name:'bills', cost:300},
//     {name:'gaming', cost:200}
// ])

// console.log(angles)

const arcPath = d3.arc()
    .outerRadius(dims.radius)
    .innerRadius(dims.radius / 2)

// console.log(arcPath(angles[0]))

const colour = d3.scaleOrdinal(d3['schemeSet3'])



const legendGroup = svg.append('g')
    .attr('transform',`translate(${dims.width + 40},10)`);

const legend = d3.legendColor()
    .shape('circle')
    .shapePadding(10)
    .scale(colour);

const tip = d3.tip()
    .attr('class','tip card')
    .html((event,d) => {
        let content = `<div class="name">${d.data.name}</div>`
        content += `<div class="cost">${d.data.cost}</div>`
        content += `<div class="delete">Click slice to delete</div>`
        return content
    })

    //important
    graph.call(tip);


//update function

const update = (data) => {

    //update colour scale domain
    colour.domain(data.map(d => d.name));

    //update and call legend
    legendGroup.call(legend);
    legendGroup.selectAll('text').attr('fill','#fff')
    
    //join enhanced (pie) data to path elements
    // console.log('update function:',data)
    const paths = graph.selectAll('path')
        .data(pie(data))

    // console.log(pie(data))

    //handle the exit selection 
    paths.exit()
        .transition().duration(750)
        .attrTween('d',arcTweenExit)
        .remove();

    //handle the currnet DOM path updates
    paths.attr('d',arcPath) //크기만 조정해주면 된다..
        .transition().duration(750)
        .attrTween('d',arcTweenUpdate)

    paths.enter()
        .append('path')
        .attr('class','arc')
        .attr('d',arcPath)
        .attr('stroke','#fff')
        .attr('stroke-width',3)
        .attr('fill',d => colour(d.data.name))
            .each(function(d){ this._current = d })
        .transition().duration(750)
            .attrTween("d",arcTweenEnter);
    // d3-v6-tip
    graph.selectAll('path')
    .on('mouseover',(event,d)=> {
        // console.log(i.data.name,this)
        console.log(event,d)
        tip.show(event,d)
        handleMouseOver(event,d)
    })
        .on('mouseout',(event,d) => {
            tip.hide();
            handleMouseOut(event,d)
        })
        .on('click',handleClick)
    // console.log('paths enter:',paths.enter())
}


//pulling data from firebase
let data = []

db.collection('expenses').onSnapshot(res => {
    res.docChanges().forEach(change => {
        const doc = {...change.doc.data(), id: change.doc.id };
        switch (change.type) {
            case 'added':
                    data.push(doc)
                break;
            case 'modified':
                    const index = data.findIndex(item => item.id == doc.id);
                    data[index] = doc;
                break;
            case 'removed':
                data = data.filter(item => item.id !== doc.id);
                break;
            default:
                break;
        }
    })
    update(data);
})



const arcTweenEnter = (d) => {
    const i = d3.interpolate(d.endAngle,d.startAngle)


    return (t) => {
        d.startAngle = i(t)
        return arcPath(d)
    }
};

const arcTweenExit = (d) => {
    const i = d3.interpolate(d.startAngle,d.endAngle)


    return function(t) {
        d.startAngle = i(t)
        return arcPath(d)
    }
};

//use function keyword to allow use of 'this'
function arcTweenUpdate(d){
    
    // interpolate between the two objects
    const i = d3.interpolate(this._current, d)
    //update the current prop with new updated data
    this._current = i(1);


    return function(t){
        return arcPath(i(t))
    }

}


//event handlers
const handleMouseOver = (d,i) => {
    // console.log(d.path[0])
    d3.select(d.path[0])
        .transition('changeSliceFill').duration(300)
            .attr('fill','#fff')
            
}

const handleMouseOut = (d,i) => {
    // console.log(d.path[0])
    d3.select(d.path[0])
        .transition('changeSliceFill').duration(300)
        .attr('fill',colour(i.data.name))
        // console.log(i.data.name)
}

const handleClick = (d,i) => {
    console.log(d,i)
    const id = i.data.id;
    db.collection('expenses').doc(id).delete()
}