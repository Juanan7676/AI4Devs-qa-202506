describe('LTI Position Interface E2E Tests', () => {
  const positionId = 1; // ID de la posición para testing
  const backendUrl = 'http://localhost:3010';

  beforeEach(() => {
    // Interceptar las llamadas al backend para mockear los datos
    cy.intercept('GET', `${backendUrl}/positions/${positionId}/interviewFlow`, {
      statusCode: 200,
      body: {
        interviewFlow: {
          interviewFlow: {
            interviewSteps: [
              { id: 1, name: 'Aplicación Recibida' },
              { id: 2, name: 'Entrevista Inicial' },
              { id: 3, name: 'Entrevista Técnica' },
              { id: 4, name: 'Oferta' }
            ]
          },
          positionName: 'Desarrollador Full Stack'
        }
      }
    }).as('getInterviewFlow');

    cy.intercept('GET', `${backendUrl}/positions/${positionId}/candidates`, {
      statusCode: 200,
      body: [
        {
          candidateId: 1,
          fullName: 'Juan Pérez',
          averageScore: 4,
          applicationId: 101,
          currentInterviewStep: 'Aplicación Recibida'
        },
        {
          candidateId: 2,
          fullName: 'María García',
          averageScore: 5,
          applicationId: 102,
          currentInterviewStep: 'Entrevista Inicial'
        },
        {
          candidateId: 3,
          fullName: 'Carlos López',
          averageScore: 3,
          applicationId: 103,
          currentInterviewStep: 'Entrevista Técnica'
        }
      ]
    }).as('getCandidates');

    // Interceptar la llamada PUT para actualizar la fase del candidato
    cy.intercept('PUT', `${backendUrl}/candidates/*`, {
      statusCode: 200,
      body: {
        message: 'Candidate stage updated successfully',
        data: {
          id: 1,
          currentInterviewStep: 2
        }
      }
    }).as('updateCandidateStage');

    // Interceptar la llamada GET para obtener las posiciones
    cy.intercept('GET', `${backendUrl}/positions`, {
      statusCode: 200,
      body: [
        {
          id: 1,
          title: 'Desarrollador Full Stack',
          contactInfo: 'John Doe',
          applicationDeadline: '2024-12-31',
          status: 'Open'
        }
      ]
    }).as('getPositions');
  });

  describe('1. Carga de la Página de Position', () => {
    it('debería cargar correctamente la página de posición con todos los elementos', () => {
      // Navegar a la página de posiciones
      cy.visit('/positions');

      // Esperar a que se carguen las posiciones
      cy.wait('@getPositions');

      // Verificar que estamos en la página de posiciones
      cy.get('h2').should('contain', 'Posiciones');

      // Hacer clic en "Ver proceso" para la primera posición
      cy.get('[data-testid="ver-proceso-btn"]').first().click();

      // Verificar que se cargan los datos del backend
      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Verificar que el título de la posición se muestra correctamente
      cy.get('h2').should('contain', 'Desarrollador Full Stack');
    });

    it('debería mostrar las columnas correspondientes a cada fase del proceso de contratación', () => {
      cy.visit(`/positions/${positionId}`);

      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Verificar que se muestran las columnas de las fases
      cy.get('.card-header').should('contain', 'Aplicación Recibida');
      cy.get('.card-header').should('contain', 'Entrevista Inicial');
      cy.get('.card-header').should('contain', 'Entrevista Técnica');
      cy.get('.card-header').should('contain', 'Oferta');

      // Verificar que hay 4 columnas (fases)
      cy.get('.col-md-3').should('have.length', 4);
    });

    it('debería mostrar las tarjetas de candidatos en la columna correcta según su fase actual', () => {
      cy.visit(`/positions/${positionId}`);

      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Verificar que Juan Pérez está en "Aplicación Recibida"
      cy.get('[data-testid="stage-column-0"]').within(() => {
        cy.get('[data-testid="candidate-card-1"]').should('contain', 'Juan Pérez');
      });

      // Verificar que María García está en "Entrevista Inicial"
      cy.get('[data-testid="stage-column-1"]').within(() => {
        cy.get('[data-testid="candidate-card-2"]').should('contain', 'María García');
      });

      // Verificar que Carlos López está en "Entrevista Técnica"
      cy.get('[data-testid="stage-column-2"]').within(() => {
        cy.get('[data-testid="candidate-card-3"]').should('contain', 'Carlos López');
      });

      // Verificar que la columna "Oferta" está vacía
      cy.get('[data-testid="stage-column-3"]').within(() => {
        cy.get('[data-testid="candidate-card-1"]').should('not.exist');
        cy.get('[data-testid="candidate-card-2"]').should('not.exist');
        cy.get('[data-testid="candidate-card-3"]').should('not.exist');
      });
    });
  });

  describe('2. Verificación de Elementos Arrastrables', () => {
    it('debería mostrar las tarjetas de candidatos como elementos arrastrables', () => {
      cy.visit(`/positions/${positionId}`);

      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Verificar que las tarjetas tienen los atributos de drag & drop
      cy.get('[data-rbd-draggable-id="1"]').should('exist');
      cy.get('[data-rbd-draggable-id="2"]').should('exist');
      cy.get('[data-rbd-draggable-id="3"]').should('exist');

      // Verificar que las columnas son droppable
      cy.get('[data-rbd-droppable-id="0"]').should('exist');
      cy.get('[data-rbd-droppable-id="1"]').should('exist');
      cy.get('[data-rbd-droppable-id="2"]').should('exist');
      cy.get('[data-rbd-droppable-id="3"]').should('exist');
    });

    it('debería permitir hacer clic en las tarjetas de candidatos', () => {
      cy.visit(`/positions/${positionId}`);

      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Hacer clic en la tarjeta de Juan Pérez
      cy.get('[data-testid="candidate-card-1"]').click();

      // Verificar que se abre el panel de detalles (si existe)
      // Esto dependerá de la implementación del componente CandidateDetails
    });
  });

  describe('3. Verificación de Calificaciones y Datos', () => {
    it('debería mostrar las calificaciones de los candidatos correctamente', () => {
      cy.visit(`/positions/${positionId}`);

      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Verificar que Juan Pérez tiene 4 estrellas
      cy.get('[data-testid="candidate-card-1"]').within(() => {
        cy.get('[role="img"]').should('have.length', 4);
      });

      // Verificar que María García tiene 5 estrellas
      cy.get('[data-testid="candidate-card-2"]').within(() => {
        cy.get('[role="img"]').should('have.length', 5);
      });

      // Verificar que Carlos López tiene 3 estrellas
      cy.get('[data-testid="candidate-card-3"]').within(() => {
        cy.get('[role="img"]').should('have.length', 3);
      });
    });

    it('debería mostrar los nombres de los candidatos correctamente', () => {
      cy.visit(`/positions/${positionId}`);

      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Verificar que se muestran todos los nombres
      cy.get('[data-testid="candidate-card-1"]').should('contain', 'Juan Pérez');
      cy.get('[data-testid="candidate-card-2"]').should('contain', 'María García');
      cy.get('[data-testid="candidate-card-3"]').should('contain', 'Carlos López');
    });
  });

  describe('4. Navegación y Estructura', () => {
    it('debería permitir navegar de vuelta a la lista de posiciones', () => {
      cy.visit(`/positions/${positionId}`);

      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Hacer clic en el botón de volver
      cy.contains('Volver a Posiciones').click();

      // Verificar que estamos de vuelta en la página de posiciones
      cy.get('h2').should('contain', 'Posiciones');
    });

    it('debería mostrar la estructura correcta del kanban board', () => {
      cy.visit(`/positions/${positionId}`);

      cy.wait('@getInterviewFlow');
      cy.wait('@getCandidates');

      // Verificar que hay un contenedor principal
      cy.get('.container').should('exist');

      // Verificar que hay una fila con las columnas
      cy.get('.row').should('exist');

      // Verificar que cada columna tiene la estructura correcta
      cy.get('[data-testid="stage-column-0"]').within(() => {
        cy.get('.card-header').should('exist');
        cy.get('.card-body').should('exist');
      });
    });
  });
});
