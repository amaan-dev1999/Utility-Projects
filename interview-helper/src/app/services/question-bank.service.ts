import { Injectable } from '@angular/core';
import { Question } from '../models/question.model';

@Injectable({ providedIn: 'root' })
export class QuestionBankService {

  private questions: Question[] = [
    // === CORE JAVA (3-5 yrs) ===
    { id: 1, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between HashMap and ConcurrentHashMap?',
      answer: 'HashMap is not thread-safe; ConcurrentHashMap uses segment-level locking (Java 7) or CAS + synchronized blocks on bins (Java 8+) for thread safety without locking the entire map.' },
    { id: 2, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the difference between "==" and ".equals()" in Java.',
      answer: '"==" compares object references (memory address). ".equals()" compares the actual content/value. String class overrides equals() to compare character sequences.' },
    { id: 3, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are functional interfaces? Give examples.',
      answer: 'An interface with exactly one abstract method, annotated with @FunctionalInterface. Examples: Runnable, Callable, Predicate, Function, Consumer, Supplier.' },
    { id: 4, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the Stream API? How does it differ from collections?',
      answer: 'Stream API processes sequences of elements functionally and lazily. Unlike collections, streams do not store data, support lazy evaluation, can be parallelized, and are consumed once.' },
    { id: 5, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the concept of immutability. How do you create an immutable class?',
      answer: 'Immutable objects cannot be changed after creation. Make class final, fields private final, no setters, deep-copy mutable fields in constructor and getters. Example: String class.' },
    { id: 6, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between checked and unchecked exceptions?',
      answer: 'Checked exceptions must be declared or caught (IOException, SQLException). Unchecked exceptions extend RuntimeException and are not required to be handled (NullPointerException, ArrayIndexOutOfBounds).' },
    { id: 7, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain Java memory model: Stack vs Heap.',
      answer: 'Stack stores method frames, local variables, and references (per thread, LIFO). Heap stores objects and instance variables (shared across threads, managed by GC).' },
    { id: 8, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the purpose of the volatile keyword?',
      answer: 'volatile ensures visibility of changes across threads by reading/writing directly to main memory, preventing thread-local caching. It does NOT guarantee atomicity.' },

    // === CORE JAVA (5-8 yrs) ===
    { id: 9, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Garbage Collection algorithms in Java. What is G1GC?',
      answer: 'GC algorithms: Serial, Parallel, CMS, G1, ZGC. G1GC divides heap into regions, performs concurrent marking, and does mixed collections targeting regions with most garbage first for predictable pause times.' },
    { id: 10, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What are the SOLID principles? Explain with examples.',
      answer: 'S-Single Responsibility, O-Open/Closed, L-Liskov Substitution, I-Interface Segregation, D-Dependency Inversion. E.g., SRP: a class should have only one reason to change.' },
    { id: 11, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain CompletableFuture and how it differs from Future.',
      answer: 'CompletableFuture supports non-blocking async programming with chaining (thenApply, thenCompose, thenCombine), exception handling (exceptionally, handle), and combining multiple futures. Future only offers blocking get().' },
    { id: 12, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is the Java Module System (JPMS) introduced in Java 9?',
      answer: 'JPMS provides strong encapsulation via module-info.java. Modules declare dependencies (requires) and exported packages (exports). Improves security, performance, and maintainability.' },
    { id: 13, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain the Fork/Join framework.',
      answer: 'Fork/Join splits tasks into subtasks recursively (fork), processes them in parallel using work-stealing algorithm, and joins results. Based on ForkJoinPool, RecursiveTask/RecursiveAction.' },
    { id: 14, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What design patterns have you used? Explain Strategy and Observer.',
      answer: 'Strategy: encapsulates interchangeable algorithms behind an interface (e.g., sorting strategies). Observer: one-to-many dependency where subjects notify observers of state changes (e.g., event listeners).' },

    // === ANGULAR (3-5 yrs) ===
    { id: 15, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between ngOnInit and constructor in Angular?',
      answer: 'Constructor is for dependency injection and basic initialization. ngOnInit runs after Angular sets input properties — use it for component initialization logic, HTTP calls, etc.' },
    { id: 16, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the difference between Reactive Forms and Template-driven Forms.',
      answer: 'Reactive Forms: model-driven, defined in TS class using FormGroup/FormControl, synchronous, easier to test. Template-driven: defined in HTML using directives (ngModel), asynchronous, simpler for basic forms.' },
    { id: 17, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are Angular lifecycle hooks? Name at least 5.',
      answer: 'ngOnChanges, ngOnInit, ngDoCheck, ngAfterContentInit, ngAfterContentChecked, ngAfterViewInit, ngAfterViewChecked, ngOnDestroy. They allow tapping into component/directive lifecycle events.' },
    { id: 18, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'How does Angular Change Detection work?',
      answer: 'Angular uses Zone.js to detect async events and triggers change detection from root to leaf. Default strategy checks all components. OnPush only checks when inputs change or events fire.' },
    { id: 19, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is lazy loading in Angular? How do you implement it?',
      answer: 'Lazy loading loads feature modules on demand via routing using loadChildren or loadComponent. Reduces initial bundle size. Configure in route definition with dynamic import().' },
    { id: 20, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain @Input() and @Output() decorators.',
      answer: '@Input() passes data from parent to child component. @Output() emits events from child to parent using EventEmitter. Together they enable component communication.' },

    // === ANGULAR (5-8 yrs) ===
    { id: 21, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What are Angular Signals and how do they improve reactivity?',
      answer: 'Signals are reactive primitives (signal, computed, effect) that track dependencies automatically and enable fine-grained reactivity without Zone.js. They replace some RxJS patterns for simpler state management.' },
    { id: 22, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Angular standalone components and their benefits.',
      answer: 'Standalone components declare their own imports directly (standalone: true), eliminating NgModules. Benefits: simpler architecture, better tree-shaking, easier lazy loading with loadComponent.' },
    { id: 23, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you optimize Angular application performance?',
      answer: 'OnPush change detection, lazy loading, trackBy in ngFor, pure pipes, AOT compilation, tree-shaking, virtual scrolling, web workers, preloading strategies, bundle analysis.' },
    { id: 24, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain RxJS operators: switchMap, mergeMap, concatMap, exhaustMap.',
      answer: 'switchMap: cancels previous, subscribes to new. mergeMap: runs all concurrently. concatMap: queues and runs sequentially. exhaustMap: ignores new until current completes. Used for HTTP, typeahead, form submits.' },
    { id: 25, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is Angular Universal / SSR and when would you use it?',
      answer: 'Angular Universal renders Angular on the server for initial HTML. Benefits: SEO, faster first contentful paint, social media previews. Use for public-facing, content-rich apps.' },
    { id: 26, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How would you implement a custom structural directive?',
      answer: 'Create a directive with @Directive, inject TemplateRef and ViewContainerRef. Use createEmbeddedView() to render or clear() to remove the template based on condition. Example: *appIf, *appFor.' },

    // === SPRING BOOT (3-5 yrs) ===
    { id: 27, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is Spring Boot auto-configuration?',
      answer: 'Auto-configuration automatically configures Spring beans based on classpath dependencies and properties. Uses @EnableAutoConfiguration, @Conditional annotations. Can be overridden or excluded.' },
    { id: 28, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain different bean scopes in Spring.',
      answer: 'Singleton (default, one per container), Prototype (new instance each time), Request (per HTTP request), Session (per HTTP session), Application (per ServletContext).' },
    { id: 29, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between @Component, @Service, @Repository, and @Controller?',
      answer: 'All are specializations of @Component for classpath scanning. @Service: business logic layer. @Repository: data access layer (adds exception translation). @Controller: web layer (handles HTTP requests).' },
    { id: 30, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'How does Spring Boot handle dependency injection?',
      answer: 'Spring IoC container manages beans and injects dependencies via constructor injection (preferred), setter injection, or field injection (@Autowired). Constructor injection ensures immutability and testability.' },
    { id: 31, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are Spring Boot Actuator endpoints?',
      answer: 'Actuator provides production-ready features: /health, /info, /metrics, /env, /beans, /loggers, /threaddump. Custom endpoints can be created. Secured via Spring Security.' },
    { id: 32, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain @Transactional annotation and its propagation types.',
      answer: '@Transactional manages DB transactions declaratively. Propagation types: REQUIRED (default, join or create), REQUIRES_NEW (always new), NESTED, SUPPORTS, NOT_SUPPORTED, MANDATORY, NEVER.' },

    // === SPRING BOOT (5-8 yrs) ===
    { id: 33, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement microservices communication patterns in Spring Boot?',
      answer: 'Synchronous: REST (RestTemplate/WebClient), gRPC, Feign Client. Asynchronous: Kafka, RabbitMQ, ActiveMQ. Patterns: API Gateway, Circuit Breaker (Resilience4j), Service Discovery (Eureka), Config Server.' },
    { id: 34, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Spring Security architecture and JWT authentication flow.',
      answer: 'Security filter chain intercepts requests. JWT flow: user authenticates → server generates JWT → client sends JWT in Authorization header → JwtAuthFilter validates token → sets SecurityContext.' },
    { id: 35, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is Spring WebFlux and when would you use it?',
      answer: 'WebFlux is Spring reactive-stack for non-blocking I/O using Reactor (Mono/Flux). Use for high-concurrency, streaming, event-driven apps. Runs on Netty. Not suitable for blocking JDBC/JPA workloads.' },
    { id: 36, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you handle distributed transactions across microservices?',
      answer: 'Saga pattern (choreography or orchestration), eventual consistency, outbox pattern, two-phase commit (2PC, rarely used). Saga uses compensating transactions for rollback across services.' },
    { id: 37, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Spring Boot profiling and how to manage environment-specific configs.',
      answer: 'Use @Profile annotation, application-{profile}.yml files. Activate via spring.profiles.active. Spring Cloud Config for centralized config. @ConfigurationProperties for type-safe config binding.' },
    { id: 38, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement caching in Spring Boot?',
      answer: 'Enable with @EnableCaching. Use @Cacheable, @CachePut, @CacheEvict annotations. Providers: EhCache, Redis, Caffeine, Hazelcast. Redis preferred for distributed caching in microservices.' },

    // === CLOUD (3-5 yrs) ===
    { id: 39, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between IaaS, PaaS, and SaaS?',
      answer: 'IaaS: infrastructure (VMs, storage) — AWS EC2. PaaS: platform for deploying apps — Heroku, Azure App Service. SaaS: complete software — Gmail, Salesforce. IaaS gives most control, SaaS least.' },
    { id: 40, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is Docker and how is it different from a virtual machine?',
      answer: 'Docker containers share host OS kernel, are lightweight and fast. VMs include full guest OS, are heavier. Docker uses images, Dockerfile, and container orchestration. VMs use hypervisors.' },
    { id: 41, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain CI/CD pipeline. What tools have you used?',
      answer: 'CI: continuous integration — auto build/test on code commit. CD: continuous delivery/deployment — auto deploy to environments. Tools: Jenkins, GitHub Actions, GitLab CI, Azure DevOps, ArgoCD.' },
    { id: 42, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is Kubernetes and why is it used?',
      answer: 'K8s is a container orchestration platform. Manages deployment, scaling, load balancing, self-healing of containerized apps. Key concepts: Pods, Services, Deployments, ConfigMaps, Ingress.' },

    // === CLOUD (5-8 yrs) ===
    { id: 43, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain the 12-factor app methodology.',
      answer: 'Guidelines for building cloud-native apps: codebase, dependencies, config, backing services, build/release/run, processes, port binding, concurrency, disposability, dev/prod parity, logs, admin processes.' },
    { id: 44, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is a service mesh? How does Istio work?',
      answer: 'Service mesh manages service-to-service communication via sidecar proxies (Envoy). Istio provides traffic management, security (mTLS), observability. Control plane configures proxies automatically.' },
    { id: 45, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you design a highly available and scalable cloud architecture?',
      answer: 'Multi-AZ deployment, auto-scaling groups, load balancers, CDN, database replication/sharding, caching (Redis), message queues, circuit breakers, health checks, blue-green/canary deployments.' },
    { id: 46, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain serverless computing and its trade-offs.',
      answer: 'Serverless (AWS Lambda, Azure Functions) runs code without managing servers. Pros: auto-scaling, pay-per-use, no ops. Cons: cold starts, vendor lock-in, execution time limits, stateless, debugging complexity.' },

    // === CORE JAVA (3-5 yrs) - Batch 2 ===
    { id: 47, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between ArrayList and LinkedList?',
      answer: 'ArrayList uses dynamic array (O(1) random access, O(n) insert/delete in middle). LinkedList uses doubly-linked list (O(n) random access, O(1) insert/delete at known position). ArrayList is better for most use cases.' },
    { id: 48, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are the different ways to create a thread in Java?',
      answer: 'Extend Thread class, implement Runnable interface, implement Callable interface (returns result), use ExecutorService thread pool, or use CompletableFuture. Runnable/Callable preferred over extending Thread.' },
    { id: 49, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the difference between abstract class and interface in Java 8+.',
      answer: 'Abstract class: can have state (fields), constructors, any access modifiers. Interface: only constants, default/static/private methods (Java 8+/9+), supports multiple inheritance. Use interface for contracts, abstract class for shared state.' },
    { id: 50, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is Optional in Java and why was it introduced?',
      answer: 'Optional is a container that may or may not contain a value. Introduced in Java 8 to avoid NullPointerException. Methods: of(), ofNullable(), isPresent(), ifPresent(), orElse(), orElseGet(), map(), flatMap().' },
    { id: 51, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain method overloading vs method overriding.',
      answer: 'Overloading: same method name, different parameters, same class, compile-time polymorphism. Overriding: same method signature, subclass redefines parent method, runtime polymorphism. @Override annotation recommended.' },
    { id: 52, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between String, StringBuilder, and StringBuffer?',
      answer: 'String is immutable. StringBuilder is mutable and not thread-safe (faster). StringBuffer is mutable and thread-safe (synchronized, slower). Use StringBuilder for single-threaded string manipulation.' },
    { id: 53, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are generics in Java? Why are they used?',
      answer: 'Generics provide compile-time type safety for collections and classes. Avoids ClassCastException at runtime. Uses type erasure (types removed at runtime). Wildcards: ?, ? extends T, ? super T.' },
    { id: 54, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the try-with-resources statement?',
      answer: 'Introduced in Java 7, auto-closes resources implementing AutoCloseable/Closeable in finally block. Eliminates boilerplate. Multiple resources separated by semicolons. Suppressed exceptions accessible via getSuppressed().' },

    // === CORE JAVA (5-8 yrs) - Batch 2 ===
    { id: 55, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Java class loading mechanism and custom class loaders.',
      answer: 'ClassLoaders follow delegation model: Bootstrap → Extension → Application. Parent-first delegation. Custom classloader extends ClassLoader, overrides findClass(). Used in app servers, OSGi, hot deployment.' },
    { id: 56, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What are sealed classes in Java and when would you use them?',
      answer: 'Sealed classes (Java 17) restrict which classes can extend them using permits keyword. Enables exhaustive pattern matching in switch. Provides controlled inheritance hierarchy. Used with records for domain modeling.' },
    { id: 57, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain the happens-before relationship in Java Memory Model.',
      answer: 'Happens-before guarantees visibility: monitor unlock → lock, volatile write → read, thread start → run, thread termination → join, final field write in constructor → read. Prevents instruction reordering issues.' },
    { id: 58, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What are records in Java and how do they differ from regular classes?',
      answer: 'Records (Java 16) are immutable data carriers. Auto-generate constructor, getters, equals(), hashCode(), toString(). Cannot extend other classes but can implement interfaces. Ideal for DTOs and value objects.' },
    { id: 59, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How does the JIT compiler optimize Java code?',
      answer: 'JIT compiles hot bytecode to native code at runtime. Optimizations: method inlining, loop unrolling, dead code elimination, escape analysis, lock elision, tiered compilation (C1 quick, C2 optimized). -XX:+PrintCompilation to monitor.' },
    { id: 60, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain the ConcurrentHashMap internal structure in Java 8.',
      answer: 'Uses array of Nodes (bins). Synchronized on first node of each bin using CAS. Bins become TreeBins when length > 8 (red-black tree). No full lock ever needed. Size tracked with CounterCell array for concurrent updates.' },

    // === ANGULAR (3-5 yrs) - Batch 2 ===
    { id: 61, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is dependency injection in Angular? How does it work?',
      answer: 'DI is a design pattern where dependencies are provided externally. Angular injector creates and manages service instances. Use @Injectable, providedIn: root (singleton), or component-level providers for scoped instances.' },
    { id: 62, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are Angular pipes? Explain pure vs impure pipes.',
      answer: 'Pipes transform data in templates using | syntax. Pure pipes (default): only re-evaluate when input reference changes. Impure pipes: re-evaluate on every change detection cycle. Built-in: date, uppercase, async, currency.' },
    { id: 63, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'How do you handle HTTP requests in Angular?',
      answer: 'Use HttpClient from @angular/common/http. Returns Observables. Methods: get(), post(), put(), delete(). Use interceptors for auth headers, error handling. Handle errors with catchError operator.' },
    { id: 64, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between ViewChild and ContentChild?',
      answer: 'ViewChild accesses elements/components in the component template. ContentChild accesses projected content (ng-content). ViewChildren/ContentChildren for multiple elements. Available after AfterViewInit/AfterContentInit.' },
    { id: 65, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain Angular route guards. Name the different types.',
      answer: 'Route guards control navigation. CanActivate: protect route entry. CanDeactivate: prevent leaving. CanActivateChild: protect child routes. Resolve: pre-fetch data. CanLoad/CanMatch: prevent lazy module loading.' },
    { id: 66, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is NgRx and when would you use it?',
      answer: 'NgRx is a state management library based on Redux pattern. Uses Store, Actions, Reducers, Effects, Selectors. Use for complex shared state, many user interactions, data accessed by multiple components. Overkill for simple apps.' },

    // === ANGULAR (5-8 yrs) - Batch 2 ===
    { id: 67, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement micro-frontends with Angular?',
      answer: 'Module Federation (Webpack 5): share dependencies, load remote modules at runtime. Native Federation for esbuild. Also: Web Components via Angular Elements, iframe-based (legacy). Consider shared state, routing, and styling isolation.' },
    { id: 68, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Angular control flow syntax (@if, @for, @switch).',
      answer: 'New built-in control flow (Angular 17+): @if/@else replaces *ngIf, @for with track replaces *ngFor (track mandatory for performance), @switch/@case replaces ngSwitch. Better performance, no directive imports needed.' },
    { id: 69, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is Angular deferrable views (@defer) and how do they work?',
      answer: '@defer lazily loads component/directive dependencies. Triggers: on viewport, on idle, on interaction, on hover, on timer, when condition. @placeholder, @loading, @error blocks for different states. Reduces initial bundle size.' },
    { id: 70, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How would you implement a complex form with dynamic fields in Angular?',
      answer: 'Use Reactive Forms with FormArray for dynamic fields. FormBuilder to create groups/arrays programmatically. Custom validators, async validators. ControlValueAccessor for custom form controls. Cross-field validation with group validators.' },
    { id: 71, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Angular HttpInterceptors and their use cases.',
      answer: 'Interceptors intercept HTTP requests/responses in a chain. Use cases: add auth tokens, log requests, handle errors globally, show loading spinners, cache responses, retry failed requests. Implement HttpInterceptorFn (functional) or HttpInterceptor (class).' },
    { id: 72, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is Zone.js and why is Angular moving away from it?',
      answer: 'Zone.js monkey-patches async APIs (setTimeout, Promise, XHR) to detect changes. Downsides: performance overhead, patches third-party code, large bundle. Angular Signals enable zoneless change detection — fine-grained, explicit reactivity.' },

    // === SPRING BOOT (3-5 yrs) - Batch 2 ===
    { id: 73, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is Spring Data JPA? How do you define custom queries?',
      answer: 'Spring Data JPA provides repository abstraction over JPA. Extends JpaRepository for CRUD. Custom queries via method naming conventions (findByNameAndAge), @Query annotation (JPQL/native), Specification API for dynamic queries.' },
    { id: 74, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the difference between @RestController and @Controller.',
      answer: '@Controller returns view names (for MVC/Thymeleaf). @RestController = @Controller + @ResponseBody, returns data directly (JSON/XML). @RestController is shorthand for REST APIs where every method returns response body.' },
    { id: 75, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'How do you handle exceptions globally in Spring Boot?',
      answer: '@ControllerAdvice + @ExceptionHandler methods for global exception handling. @ResponseStatus for HTTP status codes. ResponseEntityExceptionHandler base class. ProblemDetail (RFC 7807) for standardized error responses in Spring 6+.' },
    { id: 76, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between JPA, Hibernate and Spring Data JPA?',
      answer: 'JPA is a specification (javax.persistence/jakarta.persistence). Hibernate is a JPA implementation (ORM). Spring Data JPA is an abstraction layer that reduces boilerplate over JPA/Hibernate with repository pattern.' },
    { id: 77, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain Spring Boot application.properties vs application.yml.',
      answer: 'Both configure Spring Boot. properties: key=value flat format. yml: hierarchical YAML format, more readable for nested config. yml supports profiles in single file (---). Properties take precedence if both exist.' },
    { id: 78, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are Spring Boot starters and how do they work?',
      answer: 'Starters are dependency descriptors that bundle related dependencies. E.g., spring-boot-starter-web includes Spring MVC, Tomcat, Jackson. They trigger auto-configuration via spring.factories/AutoConfiguration.imports. Simplify dependency management.' },

    // === SPRING BOOT (5-8 yrs) - Batch 2 ===
    { id: 79, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement API rate limiting in Spring Boot?',
      answer: 'Bucket4j library with Redis for distributed rate limiting. Spring Cloud Gateway rate limiter. Custom filter/interceptor with token bucket algorithm. Resilience4j RateLimiter. Track by IP/user/API key. Return 429 Too Many Requests.' },
    { id: 80, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain the Circuit Breaker pattern and how to implement it in Spring Boot.',
      answer: 'Circuit Breaker prevents cascading failures. States: Closed (normal), Open (fail-fast), Half-Open (test). Implement with Resilience4j: @CircuitBreaker annotation, configure failure rate threshold, wait duration, fallback methods.' },
    { id: 81, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement event-driven architecture with Spring Boot and Kafka?',
      answer: 'Spring Kafka: @KafkaListener for consumers, KafkaTemplate for producers. Topics, partitions, consumer groups. Serialization with Avro/JSON. Error handling with @RetryableTopic, DLT (Dead Letter Topic). Transactional outbox pattern for reliability.' },
    { id: 82, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is Spring Boot GraalVM native image support?',
      answer: 'GraalVM native-image compiles Java to native executable. Faster startup, lower memory. Spring Boot 3+ has first-class support. Requires AOT processing, reflection hints. Limitations: no runtime class loading, dynamic proxies need config.' },
    { id: 83, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement database migration in Spring Boot?',
      answer: 'Flyway or Liquibase for version-controlled DB migrations. Flyway: SQL/Java migrations (V1__description.sql). Liquibase: XML/YAML/JSON changelogs. Auto-runs on startup. Tracks applied migrations. Supports rollback (Liquibase) and repeatable migrations.' },
    { id: 84, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Spring Boot testing strategy: unit, integration, and slice tests.',
      answer: 'Unit: @MockBean, Mockito, no Spring context. @SpringBootTest: full integration test. Slice tests: @WebMvcTest (controllers), @DataJpaTest (repositories), @WebFluxTest. @TestContainers for real DB. Use @ActiveProfiles("test").' },

    // === CLOUD (3-5 yrs) - Batch 2 ===
    { id: 85, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is a Docker Compose and how is it used?',
      answer: 'Docker Compose defines multi-container apps in docker-compose.yml. Configures services, networks, volumes. Commands: up, down, build, logs. Used for local development environments with multiple services (app + DB + cache).' },
    { id: 86, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are environment variables and how do you manage secrets in cloud?',
      answer: 'Env vars configure apps without code changes. Secrets management: AWS Secrets Manager, Azure Key Vault, HashiCorp Vault, K8s Secrets. Never hardcode secrets. Use .env files locally (gitignored), secret managers in production.' },
    { id: 87, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is a load balancer? Explain L4 vs L7 load balancing.',
      answer: 'Load balancer distributes traffic across servers. L4 (Transport): routes by IP/port, faster, TCP/UDP (AWS NLB). L7 (Application): routes by URL/headers/cookies, HTTP-aware, can do SSL termination (AWS ALB). Algorithms: round-robin, least connections, weighted.' },
    { id: 88, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is Infrastructure as Code (IaC)? Name some tools.',
      answer: 'IaC manages infrastructure through code/config files instead of manual setup. Benefits: version control, reproducibility, automation. Tools: Terraform (multi-cloud), AWS CloudFormation, Pulumi, Ansible, ARM templates (Azure).' },

    // === CLOUD (5-8 yrs) - Batch 2 ===
    { id: 89, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain blue-green and canary deployment strategies.',
      answer: 'Blue-green: two identical environments, switch traffic at once. Instant rollback. Canary: gradually route percentage of traffic to new version (5% → 25% → 100%). Canary is safer for large-scale. Both minimize downtime.' },
    { id: 90, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is observability? Explain the three pillars.',
      answer: 'Observability = understanding system state from external outputs. Three pillars: Logs (events, ELK/Loki), Metrics (numerical measurements, Prometheus/Grafana), Traces (request flow, Jaeger/Zipkin). OpenTelemetry unifies instrumentation.' },
    { id: 91, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement zero-downtime deployments in Kubernetes?',
      answer: 'Rolling updates (default strategy), readiness/liveness probes, PodDisruptionBudgets, preStop hooks for graceful shutdown, maxSurge/maxUnavailable tuning. Use HPA for auto-scaling. Blue-green with service switching or Istio traffic shifting.' },
    { id: 92, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is GitOps and how does ArgoCD implement it?',
      answer: 'GitOps uses Git as single source of truth for infrastructure and app deployments. ArgoCD watches Git repos, syncs desired state to K8s cluster automatically. Supports auto-sync, manual sync, rollback, health monitoring, multi-cluster.' },

    // === CORE JAVA (3-5 yrs) - Batch 3 ===
    { id: 93, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between Comparable and Comparator?',
      answer: 'Comparable: defines natural ordering inside the class via compareTo() (single sort). Comparator: external comparison via compare() (multiple sorts). Collections.sort() uses Comparable by default; pass Comparator for custom sorting.' },
    { id: 94, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the concept of Java Collections Framework hierarchy.',
      answer: 'Root interface: Iterable → Collection → List (ArrayList, LinkedList), Set (HashSet, TreeSet, LinkedHashSet), Queue (PriorityQueue, Deque). Map is separate: HashMap, TreeMap, LinkedHashMap, ConcurrentHashMap. Each has different ordering and performance characteristics.' },
    { id: 95, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is a deadlock? How do you prevent it?',
      answer: 'Deadlock: two+ threads block forever waiting for each other\'s locks. Prevention: lock ordering (always acquire locks in same order), timeout-based locking (tryLock), avoid nested locks, use concurrent utilities (ConcurrentHashMap, Semaphore).' },
    { id: 96, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the difference between fail-fast and fail-safe iterators.',
      answer: 'Fail-fast (ArrayList, HashMap): throws ConcurrentModificationException if collection modified during iteration. Fail-safe (ConcurrentHashMap, CopyOnWriteArrayList): works on a copy/snapshot, no exception, may not reflect latest changes.' },
    { id: 97, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the diamond problem in Java? How is it resolved?',
      answer: 'Diamond problem: ambiguity when a class inherits same method from two interfaces with default methods. Java resolves by requiring the implementing class to override the conflicting method explicitly. Class methods always win over interface defaults.' },
    { id: 98, category: 'Core Java', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is type erasure in Java generics?',
      answer: 'Type erasure removes generic type info at compile time for backward compatibility. List<String> becomes List at runtime. Cannot use instanceof with generics, cannot create generic arrays. Bridge methods generated for overriding.' },

    // === CORE JAVA (5-8 yrs) - Batch 3 ===
    { id: 99, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain virtual threads (Project Loom) and their benefits.',
      answer: 'Virtual threads (Java 21): lightweight, JVM-managed threads. Millions can run concurrently vs thousands of platform threads. Scheduled on carrier (platform) threads. Ideal for I/O-bound tasks. Thread.ofVirtual().start(), Executors.newVirtualThreadPerTaskExecutor().' },
    { id: 100, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is the Reactive Streams specification?',
      answer: 'Reactive Streams: async stream processing with non-blocking back-pressure. Interfaces: Publisher, Subscriber, Subscription, Processor. Implementations: Project Reactor (Flux/Mono), RxJava, Akka Streams. Used in Spring WebFlux.' },
    { id: 101, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you perform thread dump analysis for debugging?',
      answer: 'Capture via jstack <pid>, kill -3, JVisualVM, or JMC. Analyze thread states: RUNNABLE, BLOCKED, WAITING, TIMED_WAITING. Look for deadlocks (circular lock dependencies), thread starvation, high CPU threads. Tools: fastThread.io, TDA.' },
    { id: 102, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain pattern matching for switch (Java 21).',
      answer: 'Pattern matching in switch allows type patterns, guarded patterns (when clause), null handling, and exhaustiveness checking. Works with sealed classes for complete coverage. Replaces verbose instanceof chains. E.g., case String s when s.length() > 5.' },
    { id: 103, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is escape analysis and how does JVM use it?',
      answer: 'Escape analysis determines if an object escapes a method/thread scope. If not, JVM can: allocate on stack (scalar replacement) instead of heap, eliminate synchronization (lock elision), reduce GC pressure. Enabled by default in HotSpot C2 compiler.' },
    { id: 104, category: 'Core Java', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain structured concurrency in Java.',
      answer: 'Structured concurrency (Java 21 preview): treats groups of related tasks as a unit. StructuredTaskScope manages subtask lifecycle. ShutdownOnFailure cancels all if one fails. ShutdownOnSuccess returns first result. Prevents thread leaks, simplifies error handling.' },

    // === ANGULAR (3-5 yrs) - Batch 3 ===
    { id: 105, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between Subject, BehaviorSubject, and ReplaySubject?',
      answer: 'Subject: no initial value, only emits to current subscribers. BehaviorSubject: has initial value, new subscribers get last emitted value. ReplaySubject: replays N previous values to new subscribers. AsyncSubject: emits only last value on complete.' },
    { id: 106, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'How do you share data between sibling components in Angular?',
      answer: 'Via shared service with Subject/BehaviorSubject. Parent as mediator using @Input/@Output. State management (NgRx, signals). Route params/query params. Or inject a common parent service. Shared service is the most common approach.' },
    { id: 107, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the async pipe and why is it recommended?',
      answer: 'Async pipe subscribes to Observable/Promise in template, auto-unsubscribes on destroy. Prevents memory leaks. Works with OnPush change detection. Returns latest emitted value. Syntax: observable$ | async.' },
    { id: 108, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is Angular CLI and what are its most useful commands?',
      answer: 'CLI scaffolds, builds, serves Angular apps. Key commands: ng new (create project), ng generate (component/service/module), ng serve (dev server), ng build (production build), ng test, ng lint, ng add (add libraries).' },
    { id: 109, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'How do you implement authentication in an Angular application?',
      answer: 'Login form sends credentials to API, receives JWT. Store token in localStorage/sessionStorage or httpOnly cookie. HTTP interceptor adds Authorization header. Route guard (CanActivate) protects routes. Token refresh for expiration.' },
    { id: 110, category: 'Angular', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are Angular environments and how do you configure them?',
      answer: 'environment.ts (dev) and environment.prod.ts files store env-specific config (API URLs, feature flags). Angular CLI replaces files during build via fileReplacements in angular.json. Access via import { environment }.' },

    // === ANGULAR (5-8 yrs) - Batch 3 ===
    { id: 111, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is the inject() function and how does it differ from constructor injection?',
      answer: 'inject() (Angular 14+) retrieves dependencies in injection context without constructor. Works in standalone components, factory providers, route guards. Enables functional patterns. Cannot use outside injection context (throws error).' },
    { id: 112, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement server-side rendering with Angular hydration?',
      answer: 'Angular SSR renders on server for fast FCP. Hydration (Angular 16+) reuses server-rendered DOM instead of destroying/recreating. provideClientHydration() in app config. Reduces FID. Incremental hydration defers non-critical parts.' },
    { id: 113, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain Angular CDK (Component Dev Kit) and its key features.',
      answer: 'CDK provides behavior primitives without styling: Overlay (popups, modals), Drag & Drop, Virtual Scrolling, Clipboard, Layout (breakpoint observer), A11y (focus trap, live announcer), Portal (dynamic content). Foundation for Angular Material.' },
    { id: 114, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you handle memory leaks in Angular applications?',
      answer: 'Unsubscribe from observables in ngOnDestroy (use takeUntilDestroyed(), async pipe, or Subscription). Remove event listeners. Detach change detectors when not needed. Avoid closures holding component references. Use Chrome DevTools heap snapshots to detect.' },
    { id: 115, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is Angular Elements and when would you use it?',
      answer: 'Angular Elements converts Angular components to Custom Elements (Web Components). Use createCustomElement() and customElements.define(). Embeddable in non-Angular apps (React, Vue, plain HTML). Useful for widget libraries and micro-frontends.' },
    { id: 116, category: 'Angular', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement dynamic component loading in Angular?',
      answer: 'Use ViewContainerRef.createComponent() for imperative creation. @defer for declarative lazy loading. ComponentRef gives access to instance and change detection. Previously used ComponentFactoryResolver (deprecated). Standalone components simplify dynamic loading.' },

    // === SPRING BOOT (3-5 yrs) - Batch 3 ===
    { id: 117, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the N+1 query problem in JPA and how do you solve it?',
      answer: 'N+1: fetching parent entity triggers N separate queries for child entities. Solutions: JOIN FETCH in JPQL, @EntityGraph, @BatchSize, FetchType.LAZY with explicit fetch when needed, DTO projections to avoid entity loading.' },
    { id: 118, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain Spring Boot DevTools features.',
      answer: 'DevTools provides: automatic restart on code changes, LiveReload browser refresh, H2 console access, relaxed property binding, disabled template caching. Only active in dev (auto-disabled when running as jar). Add spring-boot-devtools dependency.' },
    { id: 119, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is the difference between @RequestParam, @PathVariable, and @RequestBody?',
      answer: '@RequestParam: query parameters (?key=value). @PathVariable: URL path variables (/users/{id}). @RequestBody: deserializes JSON request body to Java object. @RequestHeader for headers. @CookieValue for cookies.' },
    { id: 120, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'How do you validate request data in Spring Boot?',
      answer: 'Use Bean Validation (Jakarta Validation): @Valid/@Validated on method params, annotations on fields (@NotNull, @Size, @Email, @Pattern, @Min, @Max). Custom validators with @Constraint. BindingResult for error handling. @Validated for group validation.' },
    { id: 121, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is Spring AOP and what are cross-cutting concerns?',
      answer: 'AOP: Aspect-Oriented Programming for separating cross-cutting concerns. Aspects contain advice (logic) applied at join points via pointcuts. Annotations: @Aspect, @Before, @After, @Around. Use cases: logging, security, transactions, audit.' },
    { id: 122, category: 'Spring Boot', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the embedded server concept in Spring Boot.',
      answer: 'Spring Boot embeds Tomcat/Jetty/Undertow — no external server needed. Runs as standalone JAR. Configure via server.port, server.servlet.context-path. Switch server by excluding spring-boot-starter-tomcat and adding jetty/undertow starter.' },

    // === SPRING BOOT (5-8 yrs) - Batch 3 ===
    { id: 123, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement API versioning in Spring Boot?',
      answer: 'URI versioning: /api/v1/users. Header versioning: X-API-Version. Media type versioning: Accept: application/vnd.app.v1+json. Query param: ?version=1. URI versioning most common. Use @RequestMapping with produces/headers for header-based.' },
    { id: 124, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is Spring Cloud Gateway and how does it work?',
      answer: 'API Gateway built on Spring WebFlux. Routes requests to microservices based on predicates (path, header, method). Filters modify request/response (add headers, rate limit, circuit breaker). Replaces Zuul. Supports load balancing via Spring Cloud LoadBalancer.' },
    { id: 125, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain CQRS pattern and its implementation in Spring Boot.',
      answer: 'CQRS separates read and write models. Command side: handles writes, emits events. Query side: optimized read models. Implement with separate services/repositories for reads and writes. Often paired with Event Sourcing. Axon Framework provides Spring Boot integration.' },
    { id: 126, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement multi-tenancy in Spring Boot?',
      answer: 'Strategies: separate DB per tenant, shared DB with separate schema, shared schema with tenant discriminator column. Implement via Hibernate multi-tenancy (MultiTenantConnectionProvider, CurrentTenantIdentifierResolver). Tenant ID from JWT/header/subdomain.' },
    { id: 127, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is Spring Batch and when would you use it?',
      answer: 'Spring Batch processes large volumes of data in batch jobs. Components: Job → Step → (ItemReader → ItemProcessor → ItemWriter). Features: chunk-based processing, skip/retry, job scheduling, partitioning for parallel processing. Use for ETL, reports, data migration.' },
    { id: 128, category: 'Spring Boot', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you secure microservices with OAuth2 and Spring Security?',
      answer: 'Authorization Server issues tokens (Keycloak, Auth0, Spring Authorization Server). Resource servers validate JWT with spring-boot-starter-oauth2-resource-server. Client credentials for service-to-service. PKCE for SPAs. Scopes/roles for authorization.' },

    // === CLOUD (3-5 yrs) - Batch 3 ===
    { id: 129, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is a CDN and how does it improve performance?',
      answer: 'CDN (Content Delivery Network) caches static content at edge locations worldwide. Reduces latency by serving from nearest edge. Providers: CloudFront, Cloudflare, Akamai. Used for images, CSS, JS, videos. Also provides DDoS protection.' },
    { id: 130, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'Explain the difference between SQL and NoSQL databases. When would you use each?',
      answer: 'SQL: structured, ACID, relational, schema-enforced (PostgreSQL, MySQL). NoSQL: flexible schema, horizontal scaling, eventual consistency (MongoDB, DynamoDB, Cassandra, Redis). Use SQL for transactions, complex queries. NoSQL for high scale, flexible data, caching.' },
    { id: 131, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What is a message queue and why is it used?',
      answer: 'Message queue decouples producers and consumers for async communication. Benefits: load leveling, fault tolerance, scalability. Types: point-to-point (SQS), pub/sub (SNS, Kafka topics). Tools: RabbitMQ, Kafka, AWS SQS, Azure Service Bus.' },
    { id: 132, category: 'Cloud', difficulty: 'Medium', experienceRange: '3-5',
      question: 'What are microservices? How do they differ from monolithic architecture?',
      answer: 'Microservices: small, independent, deployable services each owning their data. Monolith: single deployable unit. Microservices pros: independent scaling, tech diversity, team autonomy. Cons: distributed complexity, data consistency, operational overhead.' },

    // === CLOUD (5-8 yrs) - Batch 3 ===
    { id: 133, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is the Strangler Fig pattern for migrating monolith to microservices?',
      answer: 'Incrementally replace monolith functionality with microservices. Route new features and gradually migrated features through API gateway to new services. Old monolith shrinks over time. Reduces risk compared to big-bang rewrite.' },
    { id: 134, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain the CAP theorem and its implications for distributed systems.',
      answer: 'CAP: Consistency, Availability, Partition tolerance — can only guarantee two of three during network partitions. CP: strong consistency, may refuse requests (HBase, MongoDB). AP: always available, eventual consistency (Cassandra, DynamoDB). CA only possible without network partitions.' },
    { id: 135, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you implement distributed tracing across microservices?',
      answer: 'Propagate trace context (trace ID, span ID) via HTTP headers. Tools: OpenTelemetry (standard), Jaeger, Zipkin, AWS X-Ray. Spring Boot: Micrometer Tracing (replaces Sleuth). Visualize request flow, identify bottlenecks, correlate logs.' },
    { id: 136, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'What is chaos engineering and how do you implement it?',
      answer: 'Chaos engineering: intentionally injecting failures to test system resilience. Tools: Chaos Monkey (Netflix), Litmus (K8s), Gremlin, AWS FIS. Experiments: kill pods, inject latency, simulate AZ failure. Define steady state, hypothesize, run experiment, analyze.' },
    { id: 137, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'Explain event sourcing and its advantages in cloud-native apps.',
      answer: 'Event sourcing stores state changes as immutable events instead of current state. Advantages: complete audit trail, temporal queries, event replay, supports CQRS. Challenges: eventual consistency, event versioning, storage growth. Tools: EventStoreDB, Axon, Kafka.' },
    { id: 138, category: 'Cloud', difficulty: 'Hard', experienceRange: '5-8',
      question: 'How do you design a multi-region disaster recovery strategy?',
      answer: 'Active-active: traffic to multiple regions simultaneously (lowest RTO/RPO). Active-passive: standby region activated on failure. Pilot light: minimal always-on infra in DR region. Backup-restore: cheapest, longest RTO. Consider data replication lag, DNS failover, cost.' },
  ];

  getQuestionsForCandidate(experience: number, usedQuestionIds: number[], category?: string): Question[] {
    const range = experience <= 5 ? '3-5' : '5-8';
    const available = this.questions.filter(
      q => q.experienceRange === range && !usedQuestionIds.includes(q.id)
    );

    const selected: Question[] = [];

    if (category && category !== 'All') {
      // Single-category interview: pick 11 questions from that category
      const catQuestions = available.filter(q => q.category === category);
      selected.push(...this.shuffle(catQuestions).slice(0, 11));
    } else {
      // Mixed interview: pick questions per category
      const categories: Question['category'][] = ['Core Java', 'Angular', 'Spring Boot', 'Cloud'];
      for (const cat of categories) {
        const catQuestions = available.filter(q => q.category === cat);
        const shuffled = this.shuffle(catQuestions);
        const count = cat === 'Cloud' ? 2 : 3;
        selected.push(...shuffled.slice(0, count));
      }
    }

    return selected;
  }

  private shuffle<T>(array: T[]): T[] {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  getReplacementQuestion(category: string, experienceRange: string, excludeIds: number[]): Question | null {
    const available = this.questions.filter(
      q => q.category === category && q.experienceRange === experienceRange && !excludeIds.includes(q.id)
    );
    if (available.length === 0) return null;
    return this.shuffle(available)[0];
  }

  getAllUsedQuestionIds(): number[] {
    const data = localStorage.getItem('candidates');
    if (!data) return [];
    const candidates = JSON.parse(data) as { questions: { id: number }[] }[];
    return candidates.flatMap(c => c.questions.map(q => q.id));
  }
}
