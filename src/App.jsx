import { useState, useRef, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable
}  from 'react-beautiful-dnd';
import './App.css';

function App() {
  // 1. Estado para el tema: claro (false) u oscuro (true)
  const [isDark, setIsDark] = useState(false);

  // 2. Estado para el input controlado
  const [inputValue, setInputValue] = useState('');

  // 2.1 Estado para mensaje de error
  const [errorMessage, setErrorMessage] = useState('');

  // 3. Estado para la lista dinámica (array de objetos) con persistencia:
  // Carga inicial de LocalStorage y normaliza el campo 'notified', y garantiza un id unico
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem('items');
    //parseamos o devolvemos el array vacio
    const parsed = stored ? JSON.parse(stored) : [];
    //añadimos notified:false a cada objeto (util para el hook de notificaciones)
    return parsed.map((it, idx) =>({
      //si viene sin ID, le asignamos uno basadoen timestamp+indice
      id: it.id ?? `${Date.now()}-${idx}`,
      // aseguramos notified para que no lance notificaciones pasadas
      notified: it.notified ?? false,
      // y despues preservamos el resto de las propiedades
      ...it
    }));
  });

  // 4. Opciones de cantidad al crear
  const [includeQuantity, setIncludeQuantity] = useState(false);
  const [quantityInput, setQuantityInput] = useState(1);

  // 5. Edición de cantidad
  const [editingIndex, setEditingIndex] = useState(-1);
  const [tempQuantity, setTempQuantity] = useState(1);

  // 6. Edicion de texto
  const [editingTextIndex, setEditingTextIndex] = useState(-1);
  const [tempText, setTempText] = useState('');

  // No necesita estado adicional, toggle manejado por handler

  // 7. Estado para filtro de busqueda
  const [ searchTerm, setSearchTerm ] = useState('');

  // 9. Estado para indice de elemento sobre el cual esta el raton (hover)
  const [hoveredIndex, setHoveredIndex] = useState(-1); // Trackea el elemento en hover
  const hoverTimeout = useRef(null);

  // Derived counters
  const totalItems = items.length; // Total de items
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0) // Suma de cantidades
  const completedCount = items.filter(it => it.isDone).length; // Items completados

  // 10. Atajos de teclado globales (ahora con combinaciones)
  useEffect(() => {
    function handleGlobalKey(e) {
      // Ctrl + C → borrar todo
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        handleClearAll();
      }
      // Alt + B → borrar completados
      if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        handleClearCompleted();
      }
    }
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []); // Se monta una vez

  // 11. Persistencia de datos: sincroniza 'items' con LocalStorage en cada Cambio
  useEffect(() => {
    localStorage.setItem('items', JSON.stringify(items));
  }, [items]);

  // 12. Estado de filtro por estado: 'all' = todos, 'pending' = pendientes, 'completed' = completados
  const [filterStatus, setFilterStatus] = useState('all');

  // 13. Estado de orden: puede ser 'date_desc', 'date_asc', 'alpha_asc', 'alpha_desc'
  const [sortOrder, setSortOrder] = useState('date_desc');

  // 14. Estado para prioridad al crear: 'media' por defecto
  const [selectedPriority, setSelectedPriority] = useState('media');

  // 15. Estado para categorias (tags) al crear, separadas por comas
  const [tagInput, setTagInput] = useState('');

  // 16. Estado para filtrar por categoria
  const [filterCategory, setFilterCategory] = useState('all');

  // 17. Estado para fecha de vencimiento al crear (datetime-local)
  const [dueDateInput, setDueDateInput] = useState('');

  // 18. Al iniciar: solicitar permiso al usuario para mostrar notificaciones
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 19. Revisa cada minuto items vencidos y notifica una sola vez
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    const checkInterval = setInterval(() => {
      const now = new Date();
      items.forEach(item => {
        if (item.dueDate && !item.notified) {
          const due =new Date(item.dueDate);
          if (due <= now) {
            new Notification(`Tarea vencida: ${item.text}`, {
              body: 'Se ha cumplido la fecha de vencimiento.',
            });
            // Marco como notificado para no repetir
            setItems(prev => 
              prev.map(it =>
                it.id === item.id ? { ...it, notified: true} : it
              )
            );
          }
        }
      });
    }, 60_000); // cada 60 segs



    return () => clearInterval(checkInterval);
  }, [items]);



  // Toggle de tema
  function toggleTheme() {
    setIsDark(prev => !prev);
  }  

  // Agregar un ítem a la lista
  function handleAddItem() {
    const text = inputValue.trim();
    if (text === '') return;
    // Validacion: no duplicados
    if (items.some(it => it.text === text)) {
      setErrorMessage('El item ya existe');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    const newItem = {
      text,
      id: Date.now(),
      hasQuantity: includeQuantity,
      quantity: includeQuantity ? quantityInput : 1,
      priority: selectedPriority,
      tags: tagInput
        .split(',')
        .map(t => t.trim())
        .filter(t => t !== ''),
      createdAt: new Date().toISOString(),
      dueDate: dueDateInput || null, //fecha de vencimiento
      notified: false, // para saber si ya avisamos
      isDone: false,
    };
    setItems(prev => [...prev, newItem]);
    // Limpiar el formulario despues de agregar
    setInputValue('');
    setIncludeQuantity(false);
    setQuantityInput(1);
    setSelectedPriority('media');
    setTagInput('');
    setDueDateInput('');
  }

  // Manejador de submit del formulario
  function handleSubmit(e) {
    e.preventDefault();  // Evita recarga de la página
    handleAddItem();  // Reutiliza la lógica de agregar
  }

  // Iniciar edición de cantidad
  function handleStartEditQty(idx) {
    setEditingIndex(idx);
    setTempQuantity(items[idx].quantity);
  }

  // Guardar nueva cantidad
  function handleSaveQty() {
    setItems(prev =>
      prev.map((it, i) =>
        i === editingIndex
          ? { ...it, quantity: tempQuantity }
          : it
      )
    );
    setEditingIndex(-1);
  }

  // Iniciar edicion de texto al hacer doble click
  function handleStartEditText(idx) {
    setEditingTextIndex(idx);
    setTempText(items[idx].text);
  }

  //Guardar texto editado
  function handleSaveText() {
    setItems(prev => 
      prev.map((it, i) => 
      i === editingTextIndex
      ? { ...it, text: tempText }
      : it
      )
    );
    setEditingTextIndex(-1);
  }

  // Toggle completado de un item
  function handleToggleDone(idx) {
    setItems(prev => 
      prev.map((it, i) => 
      i === idx ? { ...it, isDone: !it.isDone } : it
      )
    );
  }

  // Eliminar ítem
  function handleRemoveItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
  }

  //Borrar todos los items
  function handleClearAll() {
    setItems([]);
  }

  //Borrar solo los items completados (chequeados)
  function handleClearCompleted() {
    setItems(prev => prev.filter(it => !it.isDone));
  }

  // 14. Items filtrados y ordenados (busqueda + estado + preferencia de orden)
  const displayedItems = items
    .map((item, idx) => ({ item, idx}))

    // Filtro de busqueda por texto
    .filter(({ item }) => 
      item.text.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Filtro por estado: pendiente / completado / todos
    .filter(({ item }) => {
      if (filterStatus === 'pending') return !item.isDone;
      if (filterStatus === 'completed') return item.isDone;
      return true;
    })

    // Filtro por categoria
    .filter(({ item }) => 
      filterCategory === 'all'
        ? true
        : item.tags.includes(filterCategory)
    )

    // Ordenamiento segun sortOrder
    .sort((a, b) => {
      switch (sortOrder) {
        case 'date_asc':
          return new Date(a.item.createdAt) - new Date(b.item.createdAt);
        case 'date_desc':
          return new Date(b.item.createdAt) - new Date(a.item.createdAt);
        case 'alpha_asc':
          return a.item.text.localeCompare(b.item.text);
        case 'alpha_desc':
          return b.item.text.localeCompare(a.item.text);
        default:
          return 0;
      }
    });

    //20. Reordenamiento  con drag-and-drop
    function handleDragEnd(result) {
      if (!result.destination) return; // si se suelta fuera, nada que hacer

      const newItems = Array.from(items); //clona el array
      const [moved] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, moved);

      setItems(newItems);
    }

  return (
    <div className={isDark ? 'app-dark' : 'app-light'}>
      <div className='container'>
        <h1>Lista con estado y eventos en React</h1>

        {/* 1. Toggle de tema */}
        <section>
          <h2>1. Toggle del Tema</h2>
          <button onClick={toggleTheme}>
            {isDark ? 'Modo Claro ☀️' : 'Modo Oscuro 🌑'}
          </button>
        </section>

        <hr />

        {/* 2. Formulario controlado + cantidad usando <form Submit> */}
        <section>
          <h2>2. Formulario Controlado</h2>
          <form onSubmit={handleSubmit}>
  {/* Selector de prioridad */}
  <label style={{ display: 'block', margin: '0.5rem 0' }}>
    Prioridad:{' '}
    <select value={selectedPriority} onChange={e => setSelectedPriority(e.target.value)}>
      <option value="high">Alta</option>
      <option value="medium">Media</option>
      <option value="low">Baja</option>
    </select>
  </label>

  {/* Input de categorías */}
  <label style={{ display: 'block', margin: '0.5rem 0' }}>
    Categorías (separa con coma):{' '}
    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} />
  </label>

  {/* Checkbox para incluir cantidad */}
  <label style={{ display: 'block', margin: '0.5rem 0' }}>
    <input type="checkbox" checked={includeQuantity} onChange={e => setIncludeQuantity(e.target.checked)} />{' '}
    Incluir cantidad
  </label>
          {/* Input numerico para la cantidad, solo si se incluye la cantidad */}
          {includeQuantity && (
            <input
              type='number'
              min='1'
              value={quantityInput}
              onChange={e => setQuantityInput(Number(e.target.value))}
              style={{ width: '3rem', marginLeft: '0.5rem' }}
            />
          )}

          {/* Input de fecha y hora de vencimiento */}
          <label style={{ display: 'block', margin: '0.5rem 0' }}>
            Vence el: {' '}
            <input type="datetime-local"
            value={dueDateInput}
            onChange={e => setDueDateInput(e.target.value)} 
            />
          </label>

          {/* Input de texto controlado con onChange */}
          <input
            type='text'
            placeholder='Escribe algo...'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleAddItem();
              }
            }}
            style={{ display: 'block', marginTop: '1rem', width: '50%' }}
          />

          {/* Boton tipo submit para activar handleSubmit */}
          <button type='submit' style={{marginTop: '1rem'}}>
            Agregar a la lista
          </button>
          </form>

          {/* Mensaje de error */}
          {errorMessage && <p className='error'>{errorMessage}</p>}

          {/* Mostrar valor en tiempo real */}
          <p>
            Valor en tiempo real: {quantityInput} <strong>{inputValue}</strong>
          </p>
        </section>

        <hr />

        {/* 3. Lista dinámica con hover, filtro de busqueda, orden, toggle completado, eliminar, modificar cantidad, borrado y contadores derivados */}
        <section>
          <h2>3. Lista Dinámica</h2>

          {/* Filtros de búsqueda y orden */}
  {/* — Buscador por texto — */}
  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
    Buscar: {' '}
    <input
      type='text'
      placeholder='Buscar...'
      value={searchTerm}
      onChange={e => setSearchTerm(e.target.value)}
      style={{ width: '30%', marginRight: '1rem' }}
    />
  </label>

  { /* Filtro por categoria */}
  <label style={{ display: 'block', margin: '0.5rem 0' }}>
    Categoria:{' '}
    <select
  value={filterCategory}
  onChange={e => setFilterCategory(e.target.value)}
>
  <option value='all'>Todas</option>
  {Array.from(new Set(items.flatMap(it => it.tags))).map(tag => (
    <option
     key={tag}
     value={tag}
    >
      {tag}
    </option>
  ))}
</select>

  </label>

  {/* — Filtros por estado — */}
  <div style={{ marginBottom: '0.5rem' }}>
    <button
      onClick={() => setFilterStatus('all')}
      disabled={filterStatus === 'all'}
    >
      Todos
    </button>
    <button
      onClick={() => setFilterStatus('pending')}
      disabled={filterStatus === 'pending'}
      style={{ marginLeft: '0.5rem' }}
    >
      Pendientes
    </button>
    <button
      onClick={() => setFilterStatus('completed')}
      disabled={filterStatus === 'completed'}
      style={{ marginLeft: '0.5rem' }}
    >
      Completados
    </button>
  </div>

  {/* — Controles de orden — */}
  <label style={{ display: 'block', marginBottom: '1rem' }}>
    Ordenar por:{' '}
    <select
      value={sortOrder}
      onChange={e => setSortOrder(e.target.value)}
      style={{ marginLeft: '0.5rem' }}
    >
      <option value='date_desc'>Fecha (nuevos primero)</option>
      <option value='date_asc'>Fecha (antiguos primero)</option>
      <option value='alpha_asc'>Alfabético A→Z</option>
      <option value='alpha_desc'>Alfabético Z→A</option>
    </select>
  </label>

            {/* Botones para borrar */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <button onClick={handleClearAll}>Borrar Todo</button>
              <button onClick={handleClearCompleted} style={{ marginLeft: '0.5rem' }}>
                Borrar Completadas
                </button>
            </div>

            {/* Contadores derivados */}
            <div style={{ marginBottom: '1rem' }}>
              <p>Total de items: {totalItems}</p>
              <p>Suma de cantidades: {totalQuantity}</p>
              <p>Items completados: {completedCount}</p>
            </div>

{/* Componente DragDropContext que gestiona el comportamiento del arrastre y la caída (drag-and-drop) */}
<DragDropContext onDragEnd={handleDragEnd} isDropDisabled={true}> 
  {/* Componente Droppable que define el área donde los elementos pueden ser soltados (dragged) */}
  <Droppable droppableId="todoList">
    {(provided) => (
      // El ul es el contenedor para los elementos arrastrables, que se pasa la referencia y las propiedades necesarias
      <ul {...provided.droppableProps} ref={provided.innerRef}>
        {/* Se mapea a través de los elementos a mostrar (displayedItems) y para cada uno se crea un Draggable */}
        {displayedItems.map(({ item, idx }, index) => (
          // Componente Draggable para cada ítem, que puede ser arrastrado
          <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
            {(dragProv) => (
              // Cada li es un ítem arrastrable
              <li
                ref={dragProv.innerRef} // Se vincula el ref proporcionado por el dragProv
                {...dragProv.draggableProps} // Se pasan las propiedades necesarias para hacer el ítem arrastrable
                {...dragProv.dragHandleProps} // Se pasan las propiedades para definir el área donde se puede arrastrar
                style={{
                  ...dragProv.draggableProps.style, // Estilo predeterminado para el elemento arrastrable
                  display: 'flex', // Usamos flexbox para distribuir el contenido dentro de cada ítem
                  alignItems: 'center', // Alineación central para los ítems
                  margin: '0.5rem 0', // Margen vertical entre los ítems
                  position: 'relative', // Posición relativa para poder usar el tooltip
                  // Se aplica un borde izquierdo dependiendo de la prioridad del ítem (alto, medio o bajo)
                  borderLeft: item.priority === 'high' ? '4px solid #f87171' : item.priority === 'medium' ? '4px solid #fbbf24' : '4px solid #34d399',
                  // Cambia el color de fondo cuando el ítem es hoverado
                  backgroundColor: hoveredIndex === idx ? 'rgba(0,0,0,0.1)' : 'transparent',
                  padding: '0.5rem' // Espaciado interno
                }}
                // Maneja el evento de hover, estableciendo un retraso para cambiar el índice del elemento hoverado
                onMouseEnter={() => { hoverTimeout.current = setTimeout(() => setHoveredIndex(idx), 500); }}
                onMouseLeave={() => { clearTimeout(hoverTimeout.current); setHoveredIndex(-1); }}
              >
                {/* Si el ítem está siendo hoverado, muestra un tooltip con el texto */}
                {hoveredIndex === idx && <span style={{ position: 'absolute', top: '100%', left: '0', background: '#fff', border: '1px solid #ccc', padding: '0.2rem 0.5rem', borderRadius: '0.2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', fontSize: '0.8rem', whiteSpace: 'nowrap', zIndex: 1 }}>Tooltip: {item.text}</span>}
                {/* Checkbox para marcar si el ítem está completado o no */}
                <input type='checkbox' checked={item.isDone} onChange={() => handleToggleDone(idx)} style={{ marginRight: '0.5rem' }} />
                
                {/* Si el ítem está en modo de edición de texto, se muestra un input para editar el texto */}
                {editingTextIndex === idx ? (
                  <>
                    <input type='text' value={tempText} onChange={e => setTempText(e.target.value)} onBlur={handleSaveText} onKeyDown={e => e.key === 'Enter' && handleSaveText()} style={{ flexGrow: 1, marginRight: '0.5rem', textDecoration: item.isDone ? 'line-through' : 'none' }} />
                    {/* Si el ítem tiene una fecha de vencimiento, se muestra */}
                    {item.dueDate && <small style={{ marginLeft: '0.5rem', fontStyle: 'italic', color: '#555' }}>Vence: {new Date(item.dueDate).toLocaleString()}</small>}
                  </>
                ) : (
                  // Si no está en modo de edición, se muestra el texto del ítem
                  <span onDoubleClick={() => handleStartEditText(idx)} style={{ flexGrow: 1, cursor: 'pointer', textDecoration: item.isDone ? 'line-through' : 'none' }} title='Haz doble clic para editar'>
                    {/* Si el ítem tiene cantidad, se muestra antes del texto */}
                    {item.hasQuantity && `${item.quantity} `}{item.text}
                  </span>
                )}

                {/* Si el ítem tiene cantidad, permite editar la cantidad */}
                {item.hasQuantity && editingIndex === idx ? (
                  <>
                    <input type='number' min='1' value={tempQuantity} onChange={e => setTempQuantity(Number(e.target.value))} style={{ width: '3rem', marginLeft: '0.5rem' }} />
                    <button onClick={handleSaveQty} style={{ marginLeft: '0.5rem' }}>Guardar</button>
                  </>
                ) : (
                  item.hasQuantity && <button onClick={() => handleStartEditQty(idx)} style={{ marginLeft: '0.5rem' }}>Modificar cantidad</button>
                )}

                {/* Botón para eliminar el ítem */}
                <button onClick={() => handleRemoveItem(idx)} style={{ marginLeft: '0.5rem' }}>Eliminar</button>
              </li>
            )}
          </Draggable>
        ))}
        {/* Proporciona el placeholder para los elementos que aún no han sido soltados */}
        {provided.placeholder}
      </ul>
    )}
  </Droppable>
</DragDropContext>
                  </section>
      </div>
    </div>
  );
}

export default App;
