declare module 'uuid' {
    export function v4(): string;
}

declare module 'pg' {
    export class Pool {
        constructor(config: any);
        query(text: string, params?: any[]): Promise<any>;
        end(): Promise<void>;
    }
}

declare module '@supabase/supabase-js' {
    export function createClient(url: string, key: string): any;
} 