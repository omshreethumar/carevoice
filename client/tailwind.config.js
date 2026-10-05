export default {content:['./index.html','./src/**/*.{js,jsx}'],theme:{extend:{
fontFamily:{sans:['"Plus Jakarta Sans"','system-ui','sans-serif']},
colors:{brand:{50:'#effaf8',100:'#d5f2ee',500:'#14a89a',600:'#0e8a7e',700:'#0c6e65',900:'#0b3d3a'}},
keyframes:{up:{'0%':{opacity:0,transform:'translateY(12px)'},'100%':{opacity:1,transform:'none'}},ring:{'0%':{transform:'scale(1)',opacity:.6},'100%':{transform:'scale(2)',opacity:0}}},
animation:{up:'up .5s ease both',ring:'ring 1.4s ease-out infinite'}}},plugins:[]}
