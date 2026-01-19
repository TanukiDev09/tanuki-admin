'use client';

import { useState, useEffect } from 'react';
import { Check, Save, RotateCcw, XCircle } from 'lucide-react';
import {
  PermissionMatrix,
  ModuleName,
  PermissionAction,
  ALL_ACTIONS,
  ModuleMetadata,
} from '@/types/permission';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import './PermissionMatrix.scss';

interface PermissionMatrixProps {
  userId: string;
  initialPermissions: PermissionMatrix;
  modules: ModuleMetadata[];
  onSave: (permissions: PermissionMatrix) => Promise<void>;
  onCancel: () => void;
}

export function PermissionMatrixComponent({
  userId,
  initialPermissions,
  modules,
  onSave,
  onCancel,
}: PermissionMatrixProps) {
  const [permissions, setPermissions] = useState<PermissionMatrix>(initialPermissions);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setPermissions(initialPermissions);
    setHasChanges(false);
  }, [initialPermissions, userId]);

  const togglePermission = (module: ModuleName, action: PermissionAction) => {
    setPermissions((prev) => {
      const modulePerms = prev[module] || [];
      const newPerms = modulePerms.includes(action)
        ? modulePerms.filter((a) => a !== action)
        : [...modulePerms, action];

      setHasChanges(true);
      return {
        ...prev,
        [module]: newPerms,
      };
    });
  };

  const toggleAllActions = (module: ModuleName) => {
    setPermissions((prev) => {
      const modulePerms = prev[module] || [];
      const allSelected = ALL_ACTIONS.every((action) => modulePerms.includes(action));

      setHasChanges(true);
      return {
        ...prev,
        [module]: allSelected ? [] : [...ALL_ACTIONS],
      };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(permissions);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPermissions(initialPermissions);
    setHasChanges(false);
  };

  const hasAction = (module: ModuleName, action: PermissionAction): boolean => {
    return permissions[module]?.includes(action) || false;
  };

  const allActionsSelected = (module: ModuleName): boolean => {
    const modulePerms = permissions[module] || [];
    return ALL_ACTIONS.every((action) => modulePerms.includes(action));
  };

  return (
    <div className="permission-matrix">
      <div className="permission-matrix__header">
        <div className="permission-matrix__status">
          {hasChanges && (
            <span className="permission-matrix__status-text permission-matrix__status-text--has-changes">
              Cambios sin guardar
            </span>
          )}
        </div>
        <div className="permission-matrix__actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || loading}
            className="permission-matrix__action-btn"
          >
            <RotateCcw className="permission-matrix__btn-icon" />
            Resetear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={loading}
            className="permission-matrix__action-btn"
          >
            <XCircle className="permission-matrix__btn-icon" />
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || loading}
            className="permission-matrix__action-btn"
          >
            <Save className="permission-matrix__btn-icon" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      <div className="permission-matrix__table-container">
        <Table className="permission-matrix__table">
          <TableHeader>
            <TableRow>
              <TableHead className="permission-matrix__th--module">Módulo</TableHead>
              <TableHead className="permission-matrix__th--action">Todos</TableHead>
              <TableHead className="permission-matrix__th--action">Crear</TableHead>
              <TableHead className="permission-matrix__th--action">Leer</TableHead>
              <TableHead className="permission-matrix__th--action">Editar</TableHead>
              <TableHead className="permission-matrix__th--action">Eliminar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.map((module) => (
              <TableRow key={module.name} className="permission-matrix__row">
                <TableCell className="permission-matrix__module-info">
                  <div className="permission-matrix__module-label">{module.label}</div>
                  <div className="permission-matrix__module-description">{module.description}</div>
                </TableCell>

                <TableCell className="permission-matrix__cell--action">
                  <button
                    type="button"
                    onClick={() => toggleAllActions(module.name)}
                    className={`permission-matrix__check-button permission-matrix__check-button--all ${allActionsSelected(module.name) ? 'permission-matrix__check-button--active' : ''
                      }`}
                    aria-pressed={allActionsSelected(module.name)}
                    title="Seleccionar todos"
                  >
                    {allActionsSelected(module.name) && <Check className="permission-matrix__check-icon" />}
                  </button>
                </TableCell>

                <TableCell className="permission-matrix__cell--action">
                  <button
                    type="button"
                    onClick={() => togglePermission(module.name, PermissionAction.CREATE)}
                    className={`permission-matrix__check-button permission-matrix__check-button--create ${hasAction(module.name, PermissionAction.CREATE) ? 'permission-matrix__check-button--active' : ''
                      }`}
                    aria-pressed={hasAction(module.name, PermissionAction.CREATE)}
                    title="Crear"
                  >
                    {hasAction(module.name, PermissionAction.CREATE) && <Check className="permission-matrix__check-icon" />}
                  </button>
                </TableCell>

                <TableCell className="permission-matrix__cell--action">
                  <button
                    type="button"
                    onClick={() => togglePermission(module.name, PermissionAction.READ)}
                    className={`permission-matrix__check-button permission-matrix__check-button--read ${hasAction(module.name, PermissionAction.READ) ? 'permission-matrix__check-button--active' : ''
                      }`}
                    aria-pressed={hasAction(module.name, PermissionAction.READ)}
                    title="Leer"
                  >
                    {hasAction(module.name, PermissionAction.READ) && <Check className="permission-matrix__check-icon" />}
                  </button>
                </TableCell>

                <TableCell className="permission-matrix__cell--action">
                  <button
                    type="button"
                    onClick={() => togglePermission(module.name, PermissionAction.UPDATE)}
                    className={`permission-matrix__check-button permission-matrix__check-button--update ${hasAction(module.name, PermissionAction.UPDATE) ? 'permission-matrix__check-button--active' : ''
                      }`}
                    aria-pressed={hasAction(module.name, PermissionAction.UPDATE)}
                    title="Editar"
                  >
                    {hasAction(module.name, PermissionAction.UPDATE) && <Check className="permission-matrix__check-icon" />}
                  </button>
                </TableCell>

                <TableCell className="permission-matrix__cell--action">
                  <button
                    type="button"
                    onClick={() => togglePermission(module.name, PermissionAction.DELETE)}
                    className={`permission-matrix__check-button permission-matrix__check-button--delete ${hasAction(module.name, PermissionAction.DELETE) ? 'permission-matrix__check-button--active' : ''
                      }`}
                    aria-pressed={hasAction(module.name, PermissionAction.DELETE)}
                    title="Eliminar"
                  >
                    {hasAction(module.name, PermissionAction.DELETE) && <Check className="permission-matrix__check-icon" />}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
