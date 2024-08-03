  async function fetchData(fileName) {
    try {
      const response = await fetch(`./data/${fileName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${fileName}`);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  /**
   * Função para calcular e poder realizar o auto-ajusto dos blocos, faz toda a lógica para que os blocos se adaptem de acordo com o tamanho disponivel, assim como foi solicitado
   */
  function calcularLayout(data, width, height) {
    const totalValue = data.reduce((sum, node) => sum + node.value, 0);
    console.log("valor total da soma: " + totalValue);

    let x = 0, y = 0;
    let rowHeight = height;
    let currentX = x, currentY = y;
    let currentMaxHeight = 0;

    // essa parte da função está calculando a posição (x, y) e as dimensões de cada retangulo dentro do treemap

    data.forEach((node) => {

      //
      const nodeWidth = width * (node.value / totalValue);
      const nodeHeight = height * (node.value / totalValue);

      if (currentX + nodeWidth > width) {
        currentX = x;
        currentY += currentMaxHeight;
        currentMaxHeight = 0;
      }

      node.x = currentX;
      node.y = currentY;
      node.width = nodeWidth;
      node.height = nodeHeight;

      currentX += nodeWidth;
      if (nodeHeight > currentMaxHeight) currentMaxHeight = nodeHeight;
    });

    return data;
  }

  function colorFromRaw(ctx) {
    if (ctx.type !== 'data') return 'transparent'; 

    const value = ctx.raw.v;
    let alpha = ((Math.log(value) / 5) - 2.3);
    alpha = Math.min(Math.max(alpha, 0), 1); // Garante que alpha está entre 0 e 1
    return `rgba(255, 26, 104, ${alpha})`;
  }

  async function updateChart(fileName) {
    const data = await fetchData(fileName);
    if (data.length === 0) return; // Se não houver dados para o estado, não faça nada

    const canvas = document.getElementById('myChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const layoutData = calcularLayout(data, width, height);

    const chartData = {
      datasets: [{
        label: 'Numero Populacional',
        tree: layoutData.map(d => ({
          name: d.name,
          value: d.value,
          x: d.x,
          y: d.y,
          width: d.width,
          height: d.height
        })),
        key: 'value',
        groups: ['name'],
        backgroundColor: (ctx) => colorFromRaw(ctx),
        borderWidth: 1,
        labels: {
          display: true,
          color: 'white' // Ajusta a cor dos rótulos
        }
      }]
    };

    const config = {
      type: 'treemap',
      data: chartData,
      options: {}
    };

    // Destroy previous chart if it exists
    if (window.myChart && window.myChart instanceof Chart) {
      window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, config);
  }

  document.getElementById('stateSelect').addEventListener('change', (event) => {
    updateChart(event.target.value);
  });

  // Inicializar o gráfico com o estado selecionado por padrão
  updateChart('sao_paulo.json');